/**
 * 颜色的转换
 * author: ywq 
 * date: 2023.08.28
 */

/**
 * 16进制转10进制rgba
 * @param {*} hexcolor String #000000
 * @returns Object {r: 255, g: 255, b: 255, a: 1}
 */
function HexadecimalToRGBA(hexcolor) {
    if(typeof(hexcolor) != 'string'){
        console.log('输入颜色的格式错误，请输入16进制颜色！');
        return;
    } else{
        if(hexcolor.length >= 7){
            let decimal_r = parseInt(hexcolor.substring(1, 3), 16);
            let decimal_g = parseInt(hexcolor.substring(3, 5), 16);
            let decimal_b = parseInt(hexcolor.substring(5, 7), 16);
            let rgbacolor = {};
            if(hexcolor.length == 9) {
                let decimal_a = hexcolor.substring(7, 9) == '' ? 1 : parseFloat((parseInt(hex_a, 16) / 255).toFixed(4));
                rgbacolor = {r: decimal_r, g: decimal_g, b: decimal_b, a: decimal_a};
            } else{
                rgbacolor = {r: decimal_r, g: decimal_g, b: decimal_b };
            }
            return rgbacolor;
        }
    }
}

/**
 * 10进制rgba转16进制
 * @param {*} rgbacolor Object {r: 255, g: 255, b: 255, a: 1}
 * @returns String #000000
 */
function RGBAToHexadecimal(rgbacolor) {
    if(typeof(rgbacolor) != 'object'){
        console.log('输入颜色的格式错误，请输入10进制颜色！');
        return;
    } else {
        let hex_r = rgbacolor.r.toString(16).padStart(2, '0');
        let hex_g = rgbacolor.g.toString(16).padStart(2, '0');
        let hex_b = rgbacolor.b.toString(16).padStart(2, '0');
        let hexcolor = ''
        if(rgbacolor.a != undefined){
            let hex_a = rgbacolor.a == 1 ? '' : (rgbacolor.a * 255).toString(16).padStart(2, '0');
            hexcolor = '#' + hex_r + hex_g + hex_b + hex_a;
        } else {
            hexcolor = '#' + hex_r + hex_g + hex_b;
        }
        return hexcolor;
    }
}

/**
 * 10进制rgba转10进制rgba百分比
 * @param {*} rgbacolor Object {r: 255, g: 255, b: 255, a: 1}
 * @returns Object {r: 1, g: 0.2565, b: 0.3521, a: 1}
 */
function RGBAToRGBAPercent(rgbacolor) {
    if(typeof(rgbacolor) != 'object'){
        console.log('输入颜色的格式错误，请输入10进制颜色！');
        return;
    } else {
        let precent_r = parseFloat((rgbacolor.r / 255).toFixed(4));
        let precent_g = parseFloat((rgbacolor.g / 255).toFixed(4));
        let precent_b = parseFloat((rgbacolor.b / 255).toFixed(4));
        let rgbapercent = {};
        if(rgbacolor.a != undefined){
            rgbapercent = {r: precent_r, g: precent_g, b: precent_b, a: rgbacolor.a};
        } else {
            rgbapercent = {r: precent_r, g: precent_g, b: precent_b};
        }
        return rgbapercent;
    }
}

/**
 * 10进制rgba百分比转10进制rgba
 * @param {*} rgbapercent Object {r: 1, g: 0.2565, b: 0.3521, a: 1}
 * @returns Object {r: 255, g: 255, b: 255, a: 1}
 */
function RGBAPercentToRGBA(rgbapercent) {
    if(typeof(rgbapercent) != 'object'){
        console.log('输入颜色的格式错误，请输入10进制百分比颜色！');
        return;
    } else {
        let rgba_r = Math.round(rgbapercent.r * 255);
        let rgba_g = Math.round(rgbapercent.g * 255);
        let rgba_b = Math.round(rgbapercent.b * 255);
        let rgba = {};
        if(rgbapercent.a != undefined) {
            rgba = {r: rgba_r, g: rgba_g, b: rgba_b, a: rgbapercent.a};
        } else {
            rgba = {r: rgba_r, g: rgba_g, b: rgba_b};
        }
        return rgba;
    }
}

/**
 * 16进制转10进制rgba百分比
 * @param {*} hexcolor String #000000
 * @returns Object {r: 1, g: 0.2565, b: 0.3521, a: 1}
 */
function HexadecimalToRGBAPrecent(hexcolor) {
    if(typeof(hexcolor) != 'string'){
        console.log('输入颜色的格式错误，请输入16进制颜色！');
        return;
    } else{
        let precent_r = parseFloat((parseInt(hexcolor.substring(1, 3), 16) / 255).toFixed(4));
        let precent_g = parseFloat((parseInt(hexcolor.substring(3, 5), 16) / 255).toFixed(4));
        let precent_b = parseFloat((parseInt(hexcolor.substring(5, 7), 16) / 255).toFixed(4));
        let rgbapercent = {};
        if(hexcolor.length == 9) {
            let precent_a = parseFloat((parseInt(hexcolor.substring(7, 9), 16) / 255).toFixed(4));
            rgbapercent = {r: precent_r, g: precent_g, b: precent_b, a: precent_a};
        } else {
            rgbapercent = {r: precent_r, g: precent_g, b: precent_b};
        }
        return rgbapercent;
    }
}

/**
 * 10进制rgba百分比转16进制
 * @param {*} rgbapercent Object {r: 1, g: 0.2565, b: 0.3521, a: 1}
 * @returns String #000000
 */
function RGBAPrecentToHexadecimal(rgbapercent) {
    if(typeof(rgbapercent) != 'object'){
        console.log('输入颜色的格式错误，请输入10进制百分比颜色！');
        return;
    } else {
        let hex_r = Math.round((rgbapercent.r * 255)).toString(16).padStart(2, '0');
        let hex_g = Math.round((rgbapercent.g * 255)).toString(16).padStart(2, '0');
        let hex_b = Math.round((rgbapercent.b * 255)).toString(16).padStart(2, '0');
        let hexcolor = '';
        if(rgbapercent.a != undefined){
            let hex_a = Math.round((rgbapercent.a * 255)).toString(16).padStart(2, '0');
            hexcolor = '#' + hex_r + hex_g + hex_b + hex_a;
        } else {
            hexcolor = '#' + hex_r + hex_g + hex_b;
        }
        return hexcolor;
    }
}

export {
    HexadecimalToRGBA, RGBAToHexadecimal, RGBAToRGBAPercent, RGBAPercentToRGBA, HexadecimalToRGBAPrecent, RGBAPrecentToHexadecimal
}
