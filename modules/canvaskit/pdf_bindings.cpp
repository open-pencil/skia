/*
 * OpenPencil: expose Skia's PDF backend to CanvasKit.
 *
 * A PDFDocument hands out an ordinary Canvas per page, so anything that draws to a surface's
 * canvas can draw a PDF page instead.
 */

#include "include/codec/SkJpegDecoder.h"
#include "include/core/SkCanvas.h"
#include "include/core/SkData.h"
#include "include/core/SkDocument.h"
#include "include/core/SkStream.h"
#include "include/docs/SkPDFDocument.h"
#include "include/encode/SkJpegEncoder.h"
#include "modules/canvaskit/WasmCommon.h"

#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

Uint8Array toBytes(sk_sp<const SkData> data);

namespace {

std::unique_ptr<SkCodec> decodeJpeg(sk_sp<const SkData> data) {
    return SkJpegDecoder::Decode(std::move(data), nullptr, nullptr);
}

bool encodeJpeg(SkWStream* dst, const SkPixmap& src, int quality) {
    SkJpegEncoder::Options options;
    options.fQuality = quality;
    return SkJpegEncoder::Encode(dst, src, options);
}

class PDFDocument {
public:
    PDFDocument(std::string title, std::string creator, float rasterDPI) {
        SkPDF::Metadata metadata;
        metadata.fTitle = SkString(title.c_str());
        metadata.fCreator = SkString(creator.c_str());
        metadata.fProducer = SkString("OpenPencil (Skia/PDF)");
        if (rasterDPI > 0) metadata.fRasterDPI = rasterDPI;
        metadata.jpegDecoder = decodeJpeg;
        metadata.jpegEncoder = encodeJpeg;
        fDocument = SkPDF::MakeDocument(&fStream, metadata);
    }

    SkCanvas* beginPage(float width, float height) {
        return fDocument ? fDocument->beginPage(width, height) : nullptr;
    }

    void endPage() {
        if (fDocument) fDocument->endPage();
    }

    Uint8Array close() {
        if (!fDocument) return emscripten::val::null();
        fDocument->close();
        fDocument = nullptr;
        return toBytes(fStream.detachAsData());
    }

    void abort() {
        if (fDocument) fDocument->abort();
        fDocument = nullptr;
    }

private:
    SkDynamicMemoryWStream fStream;
    sk_sp<SkDocument> fDocument;
};

}  // namespace

EMSCRIPTEN_BINDINGS(PDF) {
    class_<PDFDocument>("PDFDocument")
        .constructor<std::string, std::string, float>()
        .function("beginPage", &PDFDocument::beginPage, allow_raw_pointers())
        .function("endPage", &PDFDocument::endPage)
        .function("close", &PDFDocument::close)
        .function("abort", &PDFDocument::abort);
}
