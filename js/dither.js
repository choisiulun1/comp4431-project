(function (imageproc) {
    "use strict";
    imageproc.measureExecutionTime = function(func,...args){
        var start = performance.now();
        func.apply(null,args);
        var end = performance.now();
        console.log("Execution time: " + (end - start) + " milliseconds.");
        return end-start;
    }
    /*
     * Apply ordered dithering to the input data
     */
    imageproc.dither = function (inputData, outputData, matrixType) {
        console.log("Applying dithering...");

        /*
         * TODO: You need to extend the dithering processing technique
         * to include multiple matrix types
         */

        // At the moment, the code works only for the Bayer's 2x2 matrix
        // You need to include other matrix types

        // Set up the matrix
        var matrix = [[1, 3], [4, 2]];
        var levels = 5;

        // The following code uses Bayer's 2x2 matrix to create the
        // dithering effect. You need to extend it to work for different
        // matrix types

        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var pixel = imageproc.getPixel(inputData, x, y);

                // Change the colour to grayscale and normalize it
                var value = (pixel.r + pixel.g + pixel.b) / 3;
                value = value / 255 * levels;

                // Get the corresponding threshold of the pixel
                var threshold = matrix[y % 2][x % 2];

                // Set the colour to black or white based on threshold
                var i = (x + y * outputData.width) * 4;
                outputData.data[i] =
                    outputData.data[i + 1] =
                        outputData.data[i + 2] = (value < threshold) ? 0 : 255;
            }
        }
    }
    imageproc.calculateIntensityError = function (img1, img2) {
        var intensityError = 0;
        var chunkSize = 4;
        var r = 0, g = 0, b = 0;
        var r2 = 0, g2 = 0, b2 = 0;
        var intensity = 0, intensity2 = 0;
        var temp = 0;
        var k = 0;
        var avg = 0;
        for (var i = 0; i < img1.data.length; i += 4) {
            r = img1.data[i] - img2.data[i];
            g = img1.data[i + 1] - img2.data[i + 1];
            b = img1.data[i + 2] - img2.data[i + 2];
            intensity = (r + g + b) / 3;
            r2 = img2.data[i];
            g2 = img2.data[i + 1];
            b2 = img2.data[i + 2];
            intensity2 = (r2 + g2 + b2) / 3;
            temp += Math.abs(intensity - intensity2);
            k += 4;
            if (k === chunkSize * 4) {
                avg++;
                intensityError += temp/chunkSize;
                temp = 0;
                k = 0;
            }
        }
        intensityError = intensityError / avg;
        return intensityError;


    }
    imageproc.errorDither = function (inputData, outputData,type,color) {
        console.log(type);
        var threshold = 127;
        var error = 0;
        var intensity = 0;
        var r = 0, g = 0, b = 0;
        var pixel,index;
        if(type==="normal" && color==="gray"){

            for(var i =0 ; i<inputData.width;i++){
                for(var j=0;j<inputData.height;j++){
                    if(j%2===0) {
                      pixel = imageproc.getPixel(inputData, i, j);
                      index = (i + j * outputData.width) * 4;
                    }
                    else{
                        pixel = imageproc.getPixel(inputData, inputData.width-1-i, j);
                        index = (inputData.width-1-i + j * outputData.width) * 4;
                    }
                    r = pixel.r + error;
                    g = pixel.g + error;
                    b = pixel.b + error;
                    intensity = (r + g + b) / 3;
                    if(intensity > threshold){
                        r = g = b = 255;
                        error = intensity - 255;
                    }else{
                        r = g = b = 0;
                        error = intensity;
                    }
                    outputData.data[index] = r;
                    outputData.data[index + 1] = g;
                    outputData.data[index + 2] = b;
                    outputData.data[index + 3] = 255;
                }
            }
        }
        if(type==="floyd" && color === "gray"){
            var errorMatrix = [[0, 0, 7], [3, 5, 1]];
            for(var i =0 ; i<inputData.width;i++){
                for(var j=0;j<inputData.height;j++){
                    if(j%2===0) {
                        pixel = imageproc.getPixel(inputData, i, j);
                        index = (i + j * outputData.width) * 4;
                    }
                    else{
                        pixel = imageproc.getPixel(inputData, inputData.width-1-i, j);
                        index = (inputData.width-1-i + j * outputData.width) * 4;
                    }
                    r = pixel.r + error;
                    g = pixel.g + error;
                    b = pixel.b + error;
                    intensity = (r + g + b) / 3;
                    if(intensity > threshold){
                        r = g = b = 255;
                        error = intensity - 255;
                    }else{
                        r = g = b = 0;
                        error = intensity;
                    }
                    outputData.data[index] = r;
                    outputData.data[index + 1] = g;
                    outputData.data[index + 2] = b;
                    outputData.data[index + 3] = 255;
                    for(var k = 0;k<2;k++){
                        for(var l = 0;l<3;l++){
                            if(i+l<inputData.width && j+k<inputData.height){
                                var index2 = (i+l + (j+k) * outputData.width) * 4;
                                outputData.data[index2] += errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 1] += errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 2] += errorMatrix[k][l] * error / 16;
                            }
                        }
                    }
                }
            }
        }
    }



}(window.imageproc = window.imageproc || {}));
