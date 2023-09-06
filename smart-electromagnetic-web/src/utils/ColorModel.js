function ColorModel(red, green, blue, alpha) {
    this.Red = red;
    this.Green = green;
    this.Blue = blue;
    this.Alpha = alpha ? alpha : 255;
}

ColorModel.FromHexRGB = function (hexstr) {
    var redstr = hexstr.substr(1, 2);
    var greenstr = hexstr.substr(3, 2);
    var bluestr = hexstr.substr(5, 2);
    return new ColorModel(parseInt(redstr, 16), parseInt(greenstr, 16), parseInt(bluestr, 16), 255);
}

ColorModel.FromHexRGBA = function (hexstr) {
    var redstr = hexstr.substr(1, 2);
    var greenstr = hexstr.substr(3, 2);
    var bluestr = hexstr.substr(5, 2);
    var alphastr = hexstr.substr(7, 2);
    return new ColorModel(parseInt(redstr, 16), parseInt(greenstr, 16), parseInt(bluestr, 16), parseInt(alphastr, 16));
}

ColorModel.prototype.toRGBstring = function () {
    return "rgb(" + this.Red + "," + this.Green + "," + this.Blue + ")";
}

ColorModel.prototype.toRGBAstring = function () {
    return "rgba(" + this.Red + "," + this.Green + "," + this.Blue + "," + this.Alpha / 255 + ")";
}

/*
 // startColor：开始颜色hex
 // endColor：结束颜色hex
 // step:几个阶级（几步）
 */
ColorModel.GetGradientColor = function (startColor, endColor, step) {

    // startR = startRGB[0];
    // startG = startRGB[1];
    // startB = startRGB[2];
    //
    // endRGB = this.colorRgb(endColor);
    // endR = endRGB[0];
    // endG = endRGB[1];
    // endB = endRGB[2];

    var sR = (endColor.Red - startColor.Red) / step;//总差值
    var sG = (endColor.Green - startColor.Green) / step;
    var sB = (endColor.Blue - startColor.Blue) / step;

    var colorArr = [];
    for (var i = 0; i < step; i++) {
        colorArr.push(new ColorModel(sR * i + startColor.Red, sG * i + startColor.Green, sB * i + startColor.Blue));
    }
    return colorArr;
}

ColorModel.GetRGBRanks_FromBlueToRed = function (ranknum) {
    var result = [];
    for (var i = 0; i <= ranknum; i++) {
        var percent = i / ranknum;
        if (percent <= 0.25) {
            result.push(new ColorModel(0, Math.floor(4 * percent * 255), 255));
        }
        else if (percent <= 0.5) {
            result.push(new ColorModel(0, 255, Math.floor((1 - 4 * (percent - 0.25)) * 255)));
        }
        else if (percent <= 0.75) {
            result.push(new ColorModel(Math.floor(4 * (percent - 0.5) * 255), 255, 0));
        }
        else {
            result.push(new ColorModel(255, Math.floor((1 - 4 * (percent - 0.75)) * 255), 0));
        }
    }
    return result;
}


export default {
    ColorModel
}
