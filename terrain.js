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
 
var Terrain = Object.create(Object, {

 	_gl : {
		writable: true,
	    value : null,
	},
    _verticesBuffer: {
	    writable: true,
        value:	null,
	},
    _indicesBuffer : {
	    writable: true,
    	value: null,
	},
	_texture : {
	    writable: true,
	    value: null,
    },
	width : {
	    value: 0,
	},
	length : {
	    value: 0,
	},
	scale : {
	     value : 10,
	},
	
	generateVerticesFromHeightMap: {
	    value: function (heightMap, width, length) {

			var vertices = [];
			var halfWidth = width / 2.0;
			var halfLength = length / 2.0;
			var index = 0;
			
			// create a grid of vertices like so (4x4 grid example)
			//  (0,H,0)   0,  1,   2,   3  (4,H,0)
			//            4,  5,   6,   7
			//            8,  9,   10, 11
			//  (0,H,4)   12, 13,  14, 15  (4,H,4)
			//
			for (var z = 0; z < length; z++) {
				for (var x = 0; x < width; x++) {
					vertices[index++] = (x - halfWidth)* this.scale;            // x
					vertices[index++] = -heightMap[x][z] * (this.scale / 5);    // y
					vertices[index++] = (z - halfLength)* this.scale;           // z
					vertices[index++] = x / (width - 1);                        // u
					vertices[index++] = z / (length - 1);                       // v
				}
			}
			return vertices;
		}
	},

    generateTriangleStripIndices: {
	    value: function(width, length) {

			var indices = [];
			var index = 0;
			 	
			// create indices for triangles in a zig-zag pattern
			// to allow us to take advantage of triangle strips while
			// only having to create 1 degenerate vertex for each row
			//
			//   vertices
			//   	      0,  1,   2,   3
			//            4,  5,   6,   7
			//            8,  9,   10, 11
			//            12, 13,  14, 15
			//
			//   indices  0,  4,  1,  5, 2, 6, 3, 7,                         
			//           (7), 11, 6, 10, 5, 9, 4, 8, 
			//           (8)  12, 9, 13, 10, 14, 11, 15.
			//  				
			for (var z = 0; z < length - 1; z++) {
				if (z % 2 == 0) {
					// for even rows work from left to right, creating indices for each
				    // triangle in the row, when we reach the end of the row, check to 
				    // see if this is the last row, and if not add a degenerate vertex to
				    // allow us to wrap back in the other direction.
					for (var x = 0; x < width; x++) {
						indices[index++] = x + (z * width);
						indices[index++] = x + (z * width) + width;
					}
					// if this is not the last row, then add a degenerate (duplicate) vertex
					if (z != length - 2) {
						indices[index++] = (width - 1) + (z * width) + width;
					}
				}
				else {				
                    // for odd rows work from right to left, creating indices for each 
					// triangle in the row, when we reach the end of the row check to see
					// if this is the last row, and if not add a degenerate vertex to 
					// allow us to wrap back in the other direction.
		            for (var x = width - 1; x > 0; x--) {
						indices[index++] = x + (z * width) + width;
						indices[index++] = x + (z * width) - 1;
					}
					// if this is not the last row, then add a degenerate (duplicate) vertex
					if (z != length - 2) {
						indices[index++] = (z * width) + width;
					}
				}
			}	
			return indices;
		}
	},
 
    texture : {
	    get : function() {
		    return this._texture;
		},
		set : function(texture) {
			this._texture = texture;
		},
	},
 
    shaderProgram : {
	    get : function() {
		    return this._shaderProgram;
		},
		set : function(shaderProgram) {
		    this._shaderProgram = shaderProgram;
		},
	},
	
    /* generate terrain mesh from the provided height map */
	init : {
        value :	function(gl, heightMap, width, length) {
			var vertices = this.generateVerticesFromHeightMap(heightMap, width, length);
			var indices  = this.generateTriangleStripIndices(width, length);

			this._verticesBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			this._verticesBuffer.numIndices = vertices.length;

			this._indicesBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	        this._indicesBuffer.numIndices = indices.length;
			
			this._gl = gl;
			this.width = width;
			this.length = length;
									
			return this;
	    }
	},
	
	/* render terrain mesh */
	render : {
	    value : function (gl) {
			
			if (this._texture) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this._texture);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
			
			gl.enableVertexAttribArray(this._shaderProgram.attribute.position);
			gl.enableVertexAttribArray(this._shaderProgram.attribute.uv);
					 
			/* vertices are in the format (x,y,z) (u,v) */
			gl.vertexAttribPointer(this._shaderProgram.attribute.position, 3, gl.FLOAT, false, 20, 0);
			gl.vertexAttribPointer(this._shaderProgram.attribute.uv,       2, gl.FLOAT, false, 20, 12);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
			gl.drawElements(gl.TRIANGLE_STRIP, this._indicesBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
			//gl.drawElements(gl.LINE_STRIP, this._indicesBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
		}
	},
 
 });