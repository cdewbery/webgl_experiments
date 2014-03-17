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
			
			for (var z = 0; z < length; z++) {
				for (var x = 0; x < width; x++) {
					vertices[index++] = x - halfWidth;      // x
					vertices[index++] = heightMap[x][z] / this.scale;    // y
					vertices[index++] = z - halfLength;     // z
					vertices[index++] = x / (width - 1);    // u
					vertices[index++] = z / (length - 1);   // v
				}
			}
			return vertices;
		}
	},

    generateTriangleStripIndices: {
	    value: function(width, length) {

			var indices = [];
			var index = 0;
			 
			for (var z = 0; z < length - 1; z++) {
				if (z % 2 == 0) {
					// even row, move from left to right
					for (var x = 0; x < width; x++) {
						indices[index++] = x + (z * width);
						indices[index++] = x + (z * width) + width;
					}
					// insert degenerate vertex if this isn't the last row
					if (z != length - 2) {
						indices[index++] = --x + (z * width);
					}
				}
				else {
				 
					// Odd row, move from right to left
					for ( var x = width - 1; x >= 0; x-- ) {
						indices[index++] = x + (z * width);
						indices[index++] = x + (z * width) + width;
					}
					// Insert degenerate vertex if this isn't the last row
					if (z != length - 2) {
						index[index++] = ++x + (z * width);
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
			//gl.drawElements(gl.TRIANGLE_STRIP, this._indicesBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
			gl.drawElements(gl.TRIANGLE_STRIP, this._indicesBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
		}
	},
 
 });