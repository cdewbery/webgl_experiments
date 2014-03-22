/*
 * Copyright 2014, Chris Dewbery
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgement in the product documentation would be
 * appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must not
 * be misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source
 * distribution.
 */

"use strict";

/* The diamond square algorithm, also known as random midpoint displacement,
 * cloud fractal, or the plasmas fractal is a method for procedurally generating
 * height maps which we can use as a base for rendering 3d terrain.
 */
var DiamondSquare = Object.create(Object, {

    _data: {
	    writable: true,
	    value: null,
	},
	
	data: {
	    get: function() {
		    return this._data;
		}
	},
	
    _image: {
	    writable: true,
		value : null,
	},
	
	image: {
	    get: function() {
		    return this._image;
		}
	},
	
    init : {
	    value: function(dataSize, seed) {
			var h = 200.0;
			
		    /* create a two dimensional array to store the height map data */
            this._data = new Array(dataSize);
			for (var i = 0; i < dataSize; i++) {
			    this.data[i] = new Array(dataSize);
			}
			
			/* initalise the corner values 
			 *
			 *      X       X
			 *      
			 *           
             *				 
			 *      X       X
			 */
			this._data[0][0] = seed;                        // top left
			this._data[0][dataSize - 1] = seed;             // bottom left
			this._data[dataSize - 1][0] = seed;             // top right
			this._data[dataSize - 1][dataSize - 1] = seed;  // bottom right

			/* while the length of the side of the squares is greater than zero */
			for (var sideLength = dataSize - 1; sideLength >= 2; sideLength /= 2, h /= 2.0) {
			    var halfSide = sideLength / 2;
				
				/* The diamond step: Taking a square of four points, generate a new value for the
				 * square midpoint. The midpoint value is calculated by averaging the four corner values
				 * and adding a random value 
				 *
				 *      A       B       point 1. calculated by averaging (topleft A, topright B, botleft C, botright D)
				 *      
				 *          1 
                 *				 
				 *      C       D
				 */
				for (var x = 0; x < dataSize - 1; x += sideLength) {
				    for (var y = 0; y < dataSize - 1; y += sideLength) {
					    var topLeft = this._data[x][y];
						var topRight = this._data[x + sideLength][y];
						var botLeft = this._data[x][y + sideLength];
						var botRight = this._data[x + sideLength][y + sideLength];
					    var avg = (topLeft + topRight + botLeft + botRight) / 4.0;
						var offset = (Math.random() * (h * 2)) - h;
                        this._data[x + halfSide][y + halfSide] = offset + avg;					
					}
			    }
			    /* The square step: Taking a diamond of four points, generate a new value for the
				 * diamond midpoint. The midpoint value is calculated by averaging the four surrounding
				 * values and adding a random value.
                 *
				 *         A   2   D      point 1. calculated by averaging (top A, left B, bot C, right B);
				 *                        point 2. calculated by averaging (top B, left A, bot B, right D);
				 *         1   B   4      point 3. calculated by averaging (top B, left C, bot B, right E); 
                 *				          point 4. calculated by averaging (top D, left B, bot E, right B);
				 *         C   3   E
				 *
				 */
			    for (var x = 0; x < dataSize; x += halfSide) {
				    for (var y = (x + halfSide) % sideLength; y < dataSize; y += sideLength) {
					    var left = this._data[(x - halfSide + dataSize - 1) % (dataSize - 1)] [y];
						var right = this._data[(x + halfSide) % (dataSize - 1)][y];
						var top = this._data[x][(y - halfSide + dataSize - 1) % (dataSize - 1)];
						var bot = this._data[x][(y + halfSide) % (dataSize - 1)];
					    var avg = (left + right + top + bot) / 4.0;
						var offset = (Math.random() * (h * 2)) - h;
                        this._data[x][y] = offset + avg;		
					}
			    }
			}

			/* calculate minimum and max and use this to scale the image output
			 * to the range of 0 - 255 */
			var maxY = -32767.0, minY = 32767.0;

            for (var x = 0; x < dataSize - 1; x++) {
                for (var y = 0; y < dataSize - 1; y++) {
				    if (this._data[x][y] > maxY)
					    maxY = this._data[x][y];
					if (this._data[x][y] < minY)
					    minY = this._data[x][y];
                }
            }	

			/* store the height map data into an ArrayBuffer in an RGB format */
			this._image = new Array(((dataSize-1) * (dataSize-1)) * 3);
			for (var x = 0; x < dataSize -1; x ++) {
			    for (var y = 0; y < dataSize -1; y ++) {
				    var pixel = ((this._data[x][y] - minY) / (maxY - minY)) * 255;
				    this._image[(x + (y * (dataSize - 1))) * 3 + 0] = pixel;  // red
					this._image[(x + (y * (dataSize - 1))) * 3 + 1] = pixel;  // green
					this._image[(x + (y * (dataSize - 1))) * 3 + 2] = pixel;  // blue
				}
			}

			return this;
		}
	},

});