import Foundation
import Vision
import CoreImage
import AppKit

// Usage: cutout <in.jpg> <out.png>
// Vision foreground mask of the whole subject, then a straight horizontal cut just above the hand:
// the hand is the dark, low-saturation blob connected to the bottom edge. Prints the kept fraction.
let args = CommandLine.arguments
guard args.count == 3, let img = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("usage: cutout in out\n".data(using: .utf8)!); exit(2)
}
let ctx = CIContext()
let W = Int(img.extent.width), H = Int(img.extent.height)
let handler = VNImageRequestHandler(ciImage: img, options: [:])
let fgReq = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([fgReq])
guard let fg = fgReq.results?.first else { FileHandle.standardError.write("no subject\n".data(using: .utf8)!); exit(3) }
let fgBuf = try fg.generateScaledMaskForImage(forInstances: fg.allInstances, from: handler)
var mask = [UInt8](repeating: 0, count: W * H)
ctx.render(CIImage(cvPixelBuffer: fgBuf), toBitmap: &mask, rowBytes: W, bounds: CGRect(x: 0, y: 0, width: W, height: H), format: .R8, colorSpace: nil)

var src = [UInt8](repeating: 0, count: W * H * 4)
ctx.render(img, toBitmap: &src, rowBytes: W * 4, bounds: img.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)

// Subject bounding box.
var minx = W, maxx = 0, miny = H, maxy = 0, fgArea = 0
for y in 0..<H { for x in 0..<W where mask[y * W + x] > 127 { fgArea += 1; minx = min(minx, x); maxx = max(maxx, x); miny = min(miny, y); maxy = max(maxy, y) } }
guard fgArea > 0 else { FileHandle.standardError.write("empty\n".data(using: .utf8)!); exit(4) }
let subjH = maxy - miny + 1

// Hand: dark pixels connected to the bottom edge, searched only in the lower 45% of the subject.
let searchTop = miny + subjH * 55 / 100
var dark = [Bool](repeating: false, count: W * H)
for y in searchTop..<H { for x in 0..<W {
  let i = y * W + x; let r = Int(src[i*4]), g = Int(src[i*4+1]), b = Int(src[i*4+2])
  let mx = max(r, g, b), mn = min(r, g, b)
  dark[i] = mask[i] > 127 && mx < 75 && (mx - mn) < 24
} }
var seen = [Bool](repeating: false, count: W * H); var stack: [Int] = []
for y in (H - 4)..<H { for x in 0..<W where dark[y * W + x] { stack.append(y * W + x) } }
var handTop = H, handArea = 0
while let i = stack.popLast() {
  if seen[i] { continue }; seen[i] = true; handArea += 1
  let x = i % W, y = i / W; handTop = min(handTop, y)
  if x > 0 && dark[i-1] && !seen[i-1] { stack.append(i-1) }
  if x < W-1 && dark[i+1] && !seen[i+1] { stack.append(i+1) }
  if y > searchTop && dark[i-W] && !seen[i-W] { stack.append(i-W) }
  if y < H-1 && dark[i+W] && !seen[i+W] { stack.append(i+W) }
}
// A black case floods itself: fall back to a fixed cut.
var cutRow: Int
var how: String
if handArea > fgArea / 4 || handArea < 200 { cutRow = miny + subjH * 84 / 100; how = "fixed84" }
else {
  cutRow = handTop - 10
  how = "handTop"
  // A cut this high means the flood ran into the case itself (dark cases); use the fixed cut instead.
  if cutRow < miny + subjH * 70 / 100 { cutRow = miny + subjH * 84 / 100; how = "fixed84" }
}
let keptFrac = Double(cutRow - miny) / Double(subjH)

let pad = Int(0.03 * Double(max(W, H)))
let x0 = max(0, minx - pad), x1 = min(W - 1, maxx + pad), y0 = max(0, miny - pad), y1 = min(H - 1, cutRow)
let cw = x1 - x0 + 1, ch = y1 - y0 + 1
var out = [UInt8](repeating: 0, count: cw * ch * 4)
for y in 0..<ch { for x in 0..<cw {
  let si = ((y0 + y) * W + (x0 + x)) * 4, di = (y * cw + x) * 4
  let a = mask[(y0 + y) * W + (x0 + x)]
  out[di] = UInt8(Int(src[si]) * Int(a) / 255); out[di+1] = UInt8(Int(src[si+1]) * Int(a) / 255); out[di+2] = UInt8(Int(src[si+2]) * Int(a) / 255); out[di+3] = a
} }
let provider = CGDataProvider(data: Data(out) as CFData)!
let cg = CGImage(width: cw, height: ch, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: cw * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue), provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent)!
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("ok \(how) kept=\(Int(keptFrac * 100))% crop=\(cw)x\(ch)")
