// Adds compile-time JS functions to augment the CanvasKit interface.
// Specifically, anything that should only be on the WebGL version of canvaskit.
// Functions in this file are supplemented by cpu.js.
(function(CanvasKit){
    CanvasKit._extraInitializations = CanvasKit._extraInitializations || [];
    CanvasKit._extraInitializations.push(function() {
      CanvasKit.MakeGPUDeviceContext = function(device) {
        if (!device) {
          return null;
        }

        // This allows native code to access this device by calling
        // `emscripten_webgpu_get_device().`
        CanvasKit.preinitializedWebGPUDevice = device;
        var context = this._MakeGrContext();
        context._device = device;

        return context;
      };

      CanvasKit.MakeGPUCanvasContext = function(devCtx, canvas, opts) {
        var canvasCtx = canvas.getContext('webgpu');
        if (!canvasCtx) {
          return null;
        }

        let format = (opts && opts.format) ? opts.format : navigator.gpu.getPreferredCanvasFormat();
        // GPUCanvasConfiguration
        canvasCtx.configure({
            device: devCtx._device,
            format: format,
            alphaMode: (opts && opts.alphaMode) ? opts.alphaMode : undefined,
        });

        var context = {
          '_inner': canvasCtx,
          '_deviceContext': devCtx,
          '_textureFormat': format,
        };
        context['requestAnimationFrame'] =  function(callback) {
          requestAnimationFrame(function() {
            const surface = CanvasKit.MakeGPUCanvasSurface(context);
            if (!surface) {
              console.error('Failed to initialize Surface for current canvas swapchain texture');
              return;
            }
            callback(surface.getCanvas());
            surface.flush();
            surface.dispose();
          });
        };
        return context;
      };

      CanvasKit.MakeGPUCanvasSurface = function(canvasCtx, colorSpace, width, height) {
        let context = canvasCtx._inner;
        if (!width) {
          width = context.canvas.width;
        }
        if (!height) {
          height = context.canvas.height;
        }
        let surface = this.MakeGPUTextureSurface(canvasCtx._deviceContext,
                                                 context.getCurrentTexture(),
                                                 canvasCtx._textureFormat,
                                                 width, height, colorSpace);
        surface._canvasContext = canvasCtx;
        return surface;
      };

      CanvasKit.MakeGPUTextureSurface = function (devCtx, texture, textureFormat, width, height, colorSpace) {
          colorSpace = colorSpace || null;

          // JsValStore and WebGPU are objects in Emscripten's library_html5_webgpu.js utility
          // library. JsValStore allows a WebGPU object to be imported by native code by calling the
          // various `emscripten_webgpu_import_*` functions.
          //
          // The CanvasKit WASM module is responsible for removing entries from the value store by
          // calling `emscripten_webgpu_release_js_handle` after importing the object.
          //
          // (see
          // https://github.com/emscripten-core/emscripten/blob/0e63f74f36b06849ef1c777b130783a43316ade0/src/library_html5_webgpu.js
          // for reference)
          return this._MakeGPUTextureSurface(
              devCtx,
              this.JsValStore.add(texture),
              this.WebGPU.TextureFormat.indexOf(textureFormat),
              width, height,
              colorSpace);
      };

      CanvasKit.Surface.prototype.requestAnimationFrame = function(callback, dirtyRect) {
        if (!this.reportBackendTypeIsGPU()) {
          return this._requestAnimationFrameInternal(callback, dirtyRect);
        }

        // For Graphite, create a fresh surface wrapping the current swapchain texture each frame.
        var canvasCtx = this._canvasContext;
        return requestAnimationFrame(function() {
          var surface = CanvasKit.MakeGPUCanvasSurface(canvasCtx);
          if (!surface) {
            console.error('Failed to create surface for current swapchain texture');
            return;
          }
          callback(surface.getCanvas());
          surface.flush(dirtyRect);
          surface.dispose();
        });
      };

      CanvasKit.Surface.prototype.drawOnce = function(callback, dirtyRect) {
        if (!this.reportBackendTypeIsGPU()) {
          this._drawOnceInternal(callback, dirtyRect);
          return;
        }

        var canvasCtx = this._canvasContext;
        requestAnimationFrame(function() {
          var surface = CanvasKit.MakeGPUCanvasSurface(canvasCtx);
          if (!surface) {
            console.error('Failed to create surface for current swapchain texture');
            return;
          }
          callback(surface.getCanvas());
          surface.flush(dirtyRect);
          surface.dispose();
        });
      };

      // Compat: older CanvasKit combined Path+PathBuilder into one class. Newer Skia
      // splits them: Path is read-only, PathBuilder has mutators. We wrap PathBuilder
      // to auto-snapshot into a real Path when passed to draw/clip calls.
      var RealPath = CanvasKit['Path'];
      var PB = CanvasKit['PathBuilder'];
      CanvasKit['Path'] = function() {
        var pb = new PB();
        // _toPath() snapshots the builder into a real SkPath for embind
        pb._toPath = function() {
          return pb.snapshot();
        };
        // Override delete to also clean up any cached snapshot
        var origDelete = pb.delete.bind(pb);
        pb.delete = function() {
          origDelete();
        };
        return pb;
      };
      // Copy static methods from the real Path class
      Object.keys(RealPath).forEach(function(k) {
        CanvasKit['Path'][k] = RealPath[k];
      });

      // Patch Canvas methods that accept Path to auto-snapshot PathBuilder
      function unwrapPath(p) {
        return (p && p._toPath) ? p._toPath() : p;
      }
      var CanvasProto = CanvasKit['Canvas'].prototype;
      var origDrawPath = CanvasProto['drawPath'];
      CanvasProto['drawPath'] = function(path, paint) {
        var rp = unwrapPath(path);
        origDrawPath.call(this, rp, paint);
        if (rp !== path) rp.delete();
      };
      var origClipPath = CanvasProto['clipPath'];
      CanvasProto['clipPath'] = function(path, op, doAntiAlias) {
        var rp = unwrapPath(path);
        origClipPath.call(this, rp, op, doAntiAlias);
        if (rp !== path) rp.delete();
      };
      // Patch PathBuilder._addPath to auto-snapshot the source path argument
      var origAddPath = PB.prototype['_addPath'];
      PB.prototype['_addPath'] = function() {
        var args = Array.prototype.slice.call(arguments);
        args[0] = unwrapPath(args[0]);
        var needsDelete = args[0] !== arguments[0];
        var result = origAddPath.apply(this, args);
        if (needsDelete) args[0].delete();
        return result;
      };
    });
}(Module));  // When this file is loaded in, the high level object is "Module".
