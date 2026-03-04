import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedOrb — Silky-smooth frame-by-frame animation.
 * Preloads ALL 350 frames, then uses requestAnimationFrame + canvas for buttery playback.
 * Loops forever with no pause/stutter at the wrap point.
 */

/* ── Build the full list of 350 frame filenames ── */
const FRAME_FILES = [
    'frame_001_0-00_000.jpg', 'frame_002_0-00_022.jpg', 'frame_003_0-00_045.jpg',
    'frame_004_0-00_068.jpg', 'frame_005_0-00_091.jpg', 'frame_006_0-00_114.jpg',
    'frame_007_0-00_137.jpg', 'frame_008_0-00_160.jpg', 'frame_009_0-00_183.jpg',
    'frame_010_0-00_206.jpg', 'frame_011_0-00_229.jpg', 'frame_012_0-00_252.jpg',
    'frame_013_0-00_275.jpg', 'frame_014_0-00_297.jpg', 'frame_015_0-00_320.jpg',
    'frame_016_0-00_343.jpg', 'frame_017_0-00_366.jpg', 'frame_018_0-00_389.jpg',
    'frame_019_0-00_412.jpg', 'frame_020_0-00_435.jpg', 'frame_021_0-00_458.jpg',
    'frame_022_0-00_481.jpg', 'frame_023_0-00_504.jpg', 'frame_024_0-00_527.jpg',
    'frame_025_0-00_550.jpg', 'frame_026_0-00_573.jpg', 'frame_027_0-00_595.jpg',
    'frame_028_0-00_618.jpg', 'frame_029_0-00_641.jpg', 'frame_030_0-00_664.jpg',
    'frame_031_0-00_687.jpg', 'frame_032_0-00_710.jpg', 'frame_033_0-00_733.jpg',
    'frame_034_0-00_756.jpg', 'frame_035_0-00_779.jpg', 'frame_036_0-00_802.jpg',
    'frame_037_0-00_825.jpg', 'frame_038_0-00_848.jpg', 'frame_039_0-00_871.jpg',
    'frame_040_0-00_893.jpg', 'frame_041_0-00_916.jpg', 'frame_042_0-00_939.jpg',
    'frame_043_0-00_962.jpg', 'frame_044_0-00_985.jpg', 'frame_045_0-01_008.jpg',
    'frame_046_0-01_031.jpg', 'frame_047_0-01_054.jpg', 'frame_048_0-01_077.jpg',
    'frame_049_0-01_100.jpg', 'frame_050_0-01_123.jpg', 'frame_051_0-01_146.jpg',
    'frame_052_0-01_169.jpg', 'frame_053_0-01_191.jpg', 'frame_054_0-01_214.jpg',
    'frame_055_0-01_237.jpg', 'frame_056_0-01_260.jpg', 'frame_057_0-01_283.jpg',
    'frame_058_0-01_306.jpg', 'frame_059_0-01_329.jpg', 'frame_060_0-01_352.jpg',
    'frame_061_0-01_375.jpg', 'frame_062_0-01_398.jpg', 'frame_063_0-01_421.jpg',
    'frame_064_0-01_444.jpg', 'frame_065_0-01_467.jpg', 'frame_066_0-01_489.jpg',
    'frame_067_0-01_512.jpg', 'frame_068_0-01_535.jpg', 'frame_069_0-01_558.jpg',
    'frame_070_0-01_581.jpg', 'frame_071_0-01_604.jpg', 'frame_072_0-01_627.jpg',
    'frame_073_0-01_650.jpg', 'frame_074_0-01_673.jpg', 'frame_075_0-01_696.jpg',
    'frame_076_0-01_719.jpg', 'frame_077_0-01_742.jpg', 'frame_078_0-01_765.jpg',
    'frame_079_0-01_787.jpg', 'frame_080_0-01_810.jpg', 'frame_081_0-01_833.jpg',
    'frame_082_0-01_856.jpg', 'frame_083_0-01_879.jpg', 'frame_084_0-01_902.jpg',
    'frame_085_0-01_925.jpg', 'frame_086_0-01_948.jpg', 'frame_087_0-01_971.jpg',
    'frame_088_0-01_994.jpg', 'frame_089_0-02_017.jpg', 'frame_090_0-02_040.jpg',
    'frame_091_0-02_063.jpg', 'frame_092_0-02_085.jpg', 'frame_093_0-02_108.jpg',
    'frame_094_0-02_131.jpg', 'frame_095_0-02_154.jpg', 'frame_096_0-02_177.jpg',
    'frame_097_0-02_200.jpg', 'frame_098_0-02_223.jpg', 'frame_099_0-02_246.jpg',
    'frame_100_0-02_269.jpg', 'frame_101_0-02_292.jpg', 'frame_102_0-02_315.jpg',
    'frame_103_0-02_338.jpg', 'frame_104_0-02_361.jpg', 'frame_105_0-02_383.jpg',
    'frame_106_0-02_406.jpg', 'frame_107_0-02_429.jpg', 'frame_108_0-02_452.jpg',
    'frame_109_0-02_475.jpg', 'frame_110_0-02_498.jpg', 'frame_111_0-02_521.jpg',
    'frame_112_0-02_544.jpg', 'frame_113_0-02_567.jpg', 'frame_114_0-02_590.jpg',
    'frame_115_0-02_613.jpg', 'frame_116_0-02_636.jpg', 'frame_117_0-02_659.jpg',
    'frame_118_0-02_681.jpg', 'frame_119_0-02_704.jpg', 'frame_120_0-02_727.jpg',
    'frame_121_0-02_750.jpg', 'frame_122_0-02_773.jpg', 'frame_123_0-02_796.jpg',
    'frame_124_0-02_819.jpg', 'frame_125_0-02_842.jpg', 'frame_126_0-02_865.jpg',
    'frame_127_0-02_888.jpg', 'frame_128_0-02_911.jpg', 'frame_129_0-02_934.jpg',
    'frame_130_0-02_957.jpg', 'frame_131_0-02_979.jpg', 'frame_132_0-03_002.jpg',
    'frame_133_0-03_025.jpg', 'frame_134_0-03_048.jpg', 'frame_135_0-03_071.jpg',
    'frame_136_0-03_094.jpg', 'frame_137_0-03_117.jpg', 'frame_138_0-03_140.jpg',
    'frame_139_0-03_163.jpg', 'frame_140_0-03_186.jpg', 'frame_141_0-03_209.jpg',
    'frame_142_0-03_232.jpg', 'frame_143_0-03_255.jpg', 'frame_144_0-03_277.jpg',
    'frame_145_0-03_300.jpg', 'frame_146_0-03_323.jpg', 'frame_147_0-03_346.jpg',
    'frame_148_0-03_369.jpg', 'frame_149_0-03_392.jpg', 'frame_150_0-03_415.jpg',
    'frame_151_0-03_438.jpg', 'frame_152_0-03_461.jpg', 'frame_153_0-03_484.jpg',
    'frame_154_0-03_507.jpg', 'frame_155_0-03_530.jpg', 'frame_156_0-03_553.jpg',
    'frame_157_0-03_575.jpg', 'frame_158_0-03_598.jpg', 'frame_159_0-03_621.jpg',
    'frame_160_0-03_644.jpg', 'frame_161_0-03_667.jpg', 'frame_162_0-03_690.jpg',
    'frame_163_0-03_713.jpg', 'frame_164_0-03_736.jpg', 'frame_165_0-03_759.jpg',
    'frame_166_0-03_782.jpg', 'frame_167_0-03_805.jpg', 'frame_168_0-03_828.jpg',
    'frame_169_0-03_851.jpg', 'frame_170_0-03_873.jpg', 'frame_171_0-03_896.jpg',
    'frame_172_0-03_919.jpg', 'frame_173_0-03_942.jpg', 'frame_174_0-03_965.jpg',
    'frame_175_0-03_988.jpg', 'frame_176_0-04_011.jpg', 'frame_177_0-04_034.jpg',
    'frame_178_0-04_057.jpg', 'frame_179_0-04_080.jpg', 'frame_180_0-04_103.jpg',
    'frame_181_0-04_126.jpg', 'frame_182_0-04_148.jpg', 'frame_183_0-04_171.jpg',
    'frame_184_0-04_194.jpg', 'frame_185_0-04_217.jpg', 'frame_186_0-04_240.jpg',
    'frame_187_0-04_263.jpg', 'frame_188_0-04_286.jpg', 'frame_189_0-04_309.jpg',
    'frame_190_0-04_332.jpg', 'frame_191_0-04_355.jpg', 'frame_192_0-04_378.jpg',
    'frame_193_0-04_401.jpg', 'frame_194_0-04_424.jpg', 'frame_195_0-04_446.jpg',
    'frame_196_0-04_469.jpg', 'frame_197_0-04_492.jpg', 'frame_198_0-04_515.jpg',
    'frame_199_0-04_538.jpg', 'frame_200_0-04_561.jpg', 'frame_201_0-04_584.jpg',
    'frame_202_0-04_607.jpg', 'frame_203_0-04_630.jpg', 'frame_204_0-04_653.jpg',
    'frame_205_0-04_676.jpg', 'frame_206_0-04_699.jpg', 'frame_207_0-04_722.jpg',
    'frame_208_0-04_744.jpg', 'frame_209_0-04_767.jpg', 'frame_210_0-04_790.jpg',
    'frame_211_0-04_813.jpg', 'frame_212_0-04_836.jpg', 'frame_213_0-04_859.jpg',
    'frame_214_0-04_882.jpg', 'frame_215_0-04_905.jpg', 'frame_216_0-04_928.jpg',
    'frame_217_0-04_951.jpg', 'frame_218_0-04_974.jpg', 'frame_219_0-04_997.jpg',
    'frame_220_0-05_020.jpg', 'frame_221_0-05_042.jpg', 'frame_222_0-05_065.jpg',
    'frame_223_0-05_088.jpg', 'frame_224_0-05_111.jpg', 'frame_225_0-05_134.jpg',
    'frame_226_0-05_157.jpg', 'frame_227_0-05_180.jpg', 'frame_228_0-05_203.jpg',
    'frame_229_0-05_226.jpg', 'frame_230_0-05_249.jpg', 'frame_231_0-05_272.jpg',
    'frame_232_0-05_295.jpg', 'frame_233_0-05_318.jpg', 'frame_234_0-05_340.jpg',
    'frame_235_0-05_363.jpg', 'frame_236_0-05_386.jpg', 'frame_237_0-05_409.jpg',
    'frame_238_0-05_432.jpg', 'frame_239_0-05_455.jpg', 'frame_240_0-05_478.jpg',
    'frame_241_0-05_501.jpg', 'frame_242_0-05_524.jpg', 'frame_243_0-05_547.jpg',
    'frame_244_0-05_570.jpg', 'frame_245_0-05_593.jpg', 'frame_246_0-05_616.jpg',
    'frame_247_0-05_638.jpg', 'frame_248_0-05_661.jpg', 'frame_249_0-05_684.jpg',
    'frame_250_0-05_707.jpg', 'frame_251_0-05_730.jpg', 'frame_252_0-05_753.jpg',
    'frame_253_0-05_776.jpg', 'frame_254_0-05_799.jpg', 'frame_255_0-05_822.jpg',
    'frame_256_0-05_845.jpg', 'frame_257_0-05_868.jpg', 'frame_258_0-05_891.jpg',
    'frame_259_0-05_914.jpg', 'frame_260_0-05_936.jpg', 'frame_261_0-05_959.jpg',
    'frame_262_0-05_982.jpg', 'frame_263_0-06_005.jpg', 'frame_264_0-06_028.jpg',
    'frame_265_0-06_051.jpg', 'frame_266_0-06_074.jpg', 'frame_267_0-06_097.jpg',
    'frame_268_0-06_120.jpg', 'frame_269_0-06_143.jpg', 'frame_270_0-06_166.jpg',
    'frame_271_0-06_189.jpg', 'frame_272_0-06_212.jpg', 'frame_273_0-06_234.jpg',
    'frame_274_0-06_257.jpg', 'frame_275_0-06_280.jpg', 'frame_276_0-06_303.jpg',
    'frame_277_0-06_326.jpg', 'frame_278_0-06_349.jpg', 'frame_279_0-06_372.jpg',
    'frame_280_0-06_395.jpg', 'frame_281_0-06_418.jpg', 'frame_282_0-06_441.jpg',
    'frame_283_0-06_464.jpg', 'frame_284_0-06_487.jpg', 'frame_285_0-06_510.jpg',
    'frame_286_0-06_532.jpg', 'frame_287_0-06_555.jpg', 'frame_288_0-06_578.jpg',
    'frame_289_0-06_601.jpg', 'frame_290_0-06_624.jpg', 'frame_291_0-06_647.jpg',
    'frame_292_0-06_670.jpg', 'frame_293_0-06_693.jpg', 'frame_294_0-06_716.jpg',
    'frame_295_0-06_739.jpg', 'frame_296_0-06_762.jpg', 'frame_297_0-06_785.jpg',
    'frame_298_0-06_808.jpg', 'frame_299_0-06_830.jpg', 'frame_300_0-06_853.jpg',
    'frame_301_0-06_876.jpg', 'frame_302_0-06_899.jpg', 'frame_303_0-06_922.jpg',
    'frame_304_0-06_945.jpg', 'frame_305_0-06_968.jpg', 'frame_306_0-06_991.jpg',
    'frame_307_0-07_014.jpg', 'frame_308_0-07_037.jpg', 'frame_309_0-07_060.jpg',
    'frame_310_0-07_083.jpg', 'frame_311_0-07_106.jpg', 'frame_312_0-07_128.jpg',
    'frame_313_0-07_151.jpg', 'frame_314_0-07_174.jpg', 'frame_315_0-07_197.jpg',
    'frame_316_0-07_220.jpg', 'frame_317_0-07_243.jpg', 'frame_318_0-07_266.jpg',
    'frame_319_0-07_289.jpg', 'frame_320_0-07_312.jpg', 'frame_321_0-07_335.jpg',
    'frame_322_0-07_358.jpg', 'frame_323_0-07_381.jpg', 'frame_324_0-07_404.jpg',
    'frame_325_0-07_426.jpg', 'frame_326_0-07_449.jpg', 'frame_327_0-07_472.jpg',
    'frame_328_0-07_495.jpg', 'frame_329_0-07_518.jpg', 'frame_330_0-07_541.jpg',
    'frame_331_0-07_564.jpg', 'frame_332_0-07_587.jpg', 'frame_333_0-07_610.jpg',
    'frame_334_0-07_633.jpg', 'frame_335_0-07_656.jpg', 'frame_336_0-07_679.jpg',
    'frame_337_0-07_702.jpg', 'frame_338_0-07_724.jpg', 'frame_339_0-07_747.jpg',
    'frame_340_0-07_770.jpg', 'frame_341_0-07_793.jpg', 'frame_342_0-07_816.jpg',
    'frame_343_0-07_839.jpg', 'frame_344_0-07_862.jpg', 'frame_345_0-07_885.jpg',
    'frame_346_0-07_908.jpg', 'frame_347_0-07_931.jpg', 'frame_348_0-07_954.jpg',
    'frame_349_0-07_977.jpg', 'frame_350_0-08_000.jpg',
];

const TOTAL = FRAME_FILES.length; // 350

export default function AnimatedOrb({ size = 200, fps = 44, className = '', style = {} }) {
    const canvasRef = useRef(null);
    const imagesRef = useRef([]);
    const animRef = useRef(null);
    const frameIdxRef = useRef(0);
    const directionRef = useRef(1);   // 1 = forward, -1 = reverse
    const lastDrawRef = useRef(0);
    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);

    const msPerFrame = 1000 / fps;

    /* ── Step 1: Preload every frame into memory ── */
    useEffect(() => {
        let loaded = 0;
        const images = new Array(TOTAL);
        let cancelled = false;

        FRAME_FILES.forEach((file, i) => {
            const img = new Image();
            img.src = `/Frames/${file}`;
            img.onload = () => {
                if (cancelled) return;
                images[i] = img;
                loaded++;
                if (loaded % 10 === 0) setProgress(Math.round((loaded / TOTAL) * 100));
                if (loaded === TOTAL) {
                    imagesRef.current = images;
                    setReady(true);
                }
            };
            img.onerror = () => {
                if (cancelled) return;
                loaded++;
                if (loaded === TOTAL) {
                    imagesRef.current = images;
                    setReady(true);
                }
            };
        });

        return () => { cancelled = true; };
    }, []);

    /* ── Step 2: Buttery-smooth ping-pong canvas animation ── */
    useEffect(() => {
        if (!ready) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Draw first frame immediately
        const firstImg = imagesRef.current[0];
        if (firstImg) {
            drawFrame(ctx, firstImg, canvas.width, canvas.height);
        }

        const tick = (now) => {
            const elapsed = now - lastDrawRef.current;

            if (elapsed >= msPerFrame) {
                // Advance with ping-pong: forward then reverse
                const nextIdx = frameIdxRef.current + directionRef.current;

                if (nextIdx >= TOTAL - 1) {
                    // Hit the last frame → start reversing
                    frameIdxRef.current = TOTAL - 1;
                    directionRef.current = -1;
                } else if (nextIdx <= 0) {
                    // Hit the first frame → start going forward
                    frameIdxRef.current = 0;
                    directionRef.current = 1;
                } else {
                    frameIdxRef.current = nextIdx;
                }

                const img = imagesRef.current[frameIdxRef.current];
                if (img) {
                    drawFrame(ctx, img, canvas.width, canvas.height);
                }

                // Correct for drift so timing stays accurate
                lastDrawRef.current = now - (elapsed % msPerFrame);
            }

            animRef.current = requestAnimationFrame(tick);
        };

        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [ready, msPerFrame]);

    return (
        <div
            className={`animated-orb ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                boxShadow:
                    '0 0 20px rgba(0, 229, 255, 0.3), ' +
                    '0 0 50px rgba(0, 229, 255, 0.15), ' +
                    '0 0 80px rgba(0, 229, 255, 0.05)',
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                width={size * 2}
                height={size * 2}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Loading indicator while frames preload */}
            {!ready && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        color: '#00e5ff',
                        fontSize: size > 80 ? 14 : 9,
                        fontFamily: 'Share Tech Mono, monospace',
                        letterSpacing: 1,
                    }}
                >
                    {progress}%
                </div>
            )}
        </div>
    );
}

/* ── Helper: draw a frame centred & cropped to a square on the canvas ── */
function drawFrame(ctx, img, cw, ch) {
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const min = Math.min(sw, sh);
    const sx = (sw - min) / 2;
    const sy = (sh - min) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, min, min, 0, 0, cw, ch);
}
