(function (imageproc) {
    "use strict";
    imageproc.measureExecutionTime = function (func, ...args) {
        var start = performance.now();
        func.apply(null, args);
        var end = performance.now();
        console.log("Execution time: " + (end - start) + " milliseconds.");
        return end - start;
    }
    /*
     * Apply ordered dithering to the input data
     */
    imageproc.dither = function(inputData, outputData, matrixType) {
        console.log("Applying dithering...");

        /*
         * TODO: You need to extend the dithering processing technique
         * to include multiple matrix types
         */

        // At the moment, the code works only for the Bayer's 2x2 matrix
        // You need to include other matrix types
        var matrix;
        var t;
        // Set up the matrix
        if(matrixType=="bayer2"){
            matrix = [ [1, 3], [4, 2] ];
            t=2;
        }
        if(matrixType=="bayer4"){
            matrix = [[1,9,3,11],[13,5,15,7],[4,12,2,10],[16,8,14,6]]
            t=4;
        }
        if(matrixType=="line"){
            matrix= [[15,15,15,25],[15,15,25,15],[15,25,15,15],[25,15,15,15]];
            t=4;
        }
        if(matrixType=="diamond"){
            matrix= [[15,15,25,15,15],[15,25,15,25,15],[25,15,15,15,25],[15,25,15,25,15],[15,15,25,15,15]];
            t=5;
        }
        console.log(matrix)
        var levels = Math.max(...matrix.flat())+1;
        if(matrixType=="line" || matrixType =="diamond"){
            levels=100;
        }
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
                var threshold = matrix[y % t][x % t];

                // Set the colour to black or white based on threshold
                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = (value < threshold)? 0 : 255;
                outputData.data[i + 1] =(value < threshold)? 0 : 255;
                outputData.data[i + 2] = (value < threshold)? 0 : 255;
            }
        }
    }
    imageproc.calculateIntensityError = function (img1, img2) {
        var intensityError = 0;
        var chunkSize = 4; // Number of pixels per chunk
        var temp = 0;
        var avg = 0;
        var k = 0;

        for (var i = 0; i < img1.data.length; i += 4) {
            var r1 = img1.data[i];
            var g1 = img1.data[i + 1];
            var b1 = img1.data[i + 2];

            var r2 = img2.data[i];
            var g2 = img2.data[i + 1];
            var b2 = img2.data[i + 2];

            // Calculate the intensity difference between the two images
            var intensity1 = (r1 + g1 + b1) / 3;
            var intensity2 = (r2 + g2 + b2) / 3;
            var intensityDifference = Math.abs(intensity1 - intensity2);

            temp += intensityDifference;
            k++;

            // If we've reached the end of a chunk, calculate the average difference for that chunk
            if (k === chunkSize) {
                intensityError += temp / chunkSize;
                temp = 0;
                k = 0;
                avg++;
            }
        }

        // Compute the overall average error
        if (avg > 0) {
            intensityError = intensityError / avg;
        } else {
            intensityError = 0;
        }

        return intensityError;
    };

    imageproc.errorDither = function (inputData, outputData, type, color) {
        console.log(type,color);
        var threshold = 128;
        var error = 0;
        var intensity = 0;
        var r = 0, g = 0, b = 0;
        var pixel, index;
        if (type === "normal" && color === "gray") {

            for (var i = 0; i < inputData.width; i++) {
                for (var j = 0; j < inputData.height; j++) {
                    pixel = imageproc.getPixel(inputData, i, j);
                    index = (i + j * outputData.width) * 4;

                    r = pixel.r + error;
                    g = pixel.g + error;
                    b = pixel.b + error;
                    intensity = (r + g + b) / 3;
                    if (intensity > threshold) {
                        r = g = b = 255;
                        error = intensity - 255;
                    } else {
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
        if (type === "floyd" && color === "gray") {
            var errorMatrix = [[0, 0, 7], [3, 5, 1]];
            for (var i = 0; i < inputData.width; i++) {
                for (var j = 0; j < inputData.height; j++) {
                    pixel = imageproc.getPixel(inputData, i, j);
                    index = (i + j * outputData.width) * 4;
                    r = pixel.r + error;
                    g = pixel.g + error;
                    b = pixel.b + error;
                    intensity = (r + g + b) / 3;
                    if (intensity > threshold) {
                        r = g = b = 255;
                        error = intensity - 255;
                    } else {
                        r = g = b = 0;
                        error = intensity;
                    }
                    outputData.data[index] = r;
                    outputData.data[index + 1] = g;
                    outputData.data[index + 2] = b;
                    outputData.data[index + 3] = 255;
                    for (var k = 0; k < 2; k++) {
                        for (var l = 0; l < 3; l++) {
                            if (i + l < inputData.width && j + k < inputData.height) {
                                const index2 = (i + l + (j + k) * outputData.width) * 4;
                                outputData.data[index2] += errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 1] += errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 2] += errorMatrix[k][l] * error / 16;
                            }
                        }
                    }
                }
            }
        }
        if (type === "floyd" && color === "color") {
            // Floyd-Steinberg dithering in 8-bit colors
            var palette = [
                [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0],
                [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
                [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0],
                [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255]
            ];

            function findNearestColor(r, g, b) {
                var nearestIndex = 0;
                var minDistance = Number.MAX_VALUE;

                for (var i = 0; i < palette.length; i++) {
                    var pr = palette[i][0];
                    var pg = palette[i][1];
                    var pb = palette[i][2];

                    var distance = Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2);
                    if (distance < minDistance) {
                        nearestIndex = i;
                        minDistance = distance;
                    }
                }
                return palette[nearestIndex];
            }

            function distributeError(x, y, dr, dg, db, coeff) {
                var nx = x;
                var ny = y;
                if (nx >= 0 && nx < inputData.width && ny >= 0 && ny < inputData.height) {
                    var nindex = (nx + ny * outputData.width) * 4;
                    outputData.data[nindex] = Math.min(255, Math.max(0, outputData.data[nindex] + dr * coeff / 16));
                    outputData.data[nindex + 1] = Math.min(255, Math.max(0, outputData.data[nindex + 1] + dg * coeff / 16));
                    outputData.data[nindex + 2] = Math.min(255, Math.max(0, outputData.data[nindex + 2] + db * coeff / 16));
                }
            }

            for (var y = 0; y < inputData.height; y++) {
                for (var x = 0; x < inputData.width; x++) {
                    var index = (x + y * outputData.width) * 4;
                    var pixel = imageproc.getPixel(inputData, x, y);

                    var oldR = pixel.r;
                    var oldG = pixel.g;
                    var oldB = pixel.b;

                    var nearestColor = findNearestColor(oldR, oldG, oldB);
                    var newR = nearestColor[0];
                    var newG = nearestColor[1];
                    var newB = nearestColor[2];

                    // Set the pixel value to the nearest color
                    outputData.data[index] = newR;
                    outputData.data[index + 1] = newG;
                    outputData.data[index + 2] = newB;
                    outputData.data[index + 3] = 255;

                    // Calculate errors
                    var errorR = oldR - newR;
                    var errorG = oldG - newG;
                    var errorB = oldB - newB;

                    // Distribute the errors using Floyd-Steinberg matrix
                    distributeError(x + 1, y, errorR, errorG, errorB, 7);
                    distributeError(x - 1, y + 1, errorR, errorG, errorB, 3);
                    distributeError(x, y + 1, errorR, errorG, errorB, 5);
                    distributeError(x + 1, y + 1, errorR, errorG, errorB, 1);
                }
            }
        }
        // set the intensity error
        if (color === "gray") {
            error = imageproc.calculateIntensityError(inputData, outputData);
            //set the id error text to error
            $("#intensity-error").text(error.toFixed(2));
        }
    }

}(window.imageproc = window.imageproc || {}));
