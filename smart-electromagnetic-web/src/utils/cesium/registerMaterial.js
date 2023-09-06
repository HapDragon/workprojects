// EllipseWave
let source = `
        uniform vec4 color;
        uniform float count;
        uniform float gradient;
        uniform float speed;
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            material.diffuse = 1.5 * color.rgb;
            vec2 st = materialInput.st;
            vec3 str = materialInput.str;
            float dis = distance(st, vec2(0.5, 0.5));
            float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
            float per = fract(time);
            if (abs(str.z) > 0.001) {
                discard;
            }
            if (dis > 0.5) { 
                discard; 
            } else { 
                float perDis = 0.5 / count;
                float disNum; 
                float bl = .0; 
                for (int i = 0; i <= 999; i++) { 
                    if (float(i) <= count) { 
                        disNum = perDis * float(i) - dis + per / count; 
                        if (disNum > 0.0) { 
                            if (disNum < perDis) { 
                                bl = 1.0 - disNum / perDis;
                            }
                            else if (disNum - perDis < perDis) { 
                                bl = 1.0 - abs(1.0 - disNum / perDis); 
                            }
                            material.alpha = pow(bl, gradient); 
                        }
                    }
                }
            } 
            return material; 
        }`;
Cesium.Material._materialCache.addMaterial("EllipseWave", {
    fabric: {
        type: "EllipseWave",
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
            speed: 10,
            count: 1,
            gradient: 0.1,
        },
        source: source,
    },
    translucent: function (material) {
        return material.uniforms.color.alpha <= 1.0;
    },
});