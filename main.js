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

 /* default fragment and vertex shaders, if we were clever we would import these
  * from a file, rather than just hard-coding them here */
 var fragmentShaderSource =
    "precision mediump float;                                                 \
	uniform sampler2D sampler;                                                \
	varying vec2 vUV;                                                         \
                                                                              \
    void main(void) {                                                         \
        gl_FragColor = texture2D(sampler, vUV);                               \
    }";
	
 var vertexShaderSource =                                                    	
    "attribute vec3 position;                                                 \
    uniform mat4 uMVMatrix;                                                   \
    uniform mat4 uPMatrix;                                                    \
	attribute vec2 uv;                                                        \
	varying vec2 vUV;                                                         \
	                                                                          \
    void main(void) {                                                         \
        gl_Position = uPMatrix * uMVMatrix * vec4(position, 1.0);             \
		vUV = uv;                                                             \
    }";

 var camera;
 var shaderProgram;
 var projectionMatrix;
 var viewMatrix;
 var squareVertexPositionBuffer;
 var squareTexture;
 var gl;
 
 /* compile the provided shaderCode and return a shader which we can then
  * include in the shader program */ 
 function compileShader(gl, type, shaderCode) 
 {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
	return shader;
 }
 
 /* compile a shader program from the provided shader source
  * @param vertexShaderCode vertex shader source code to compile
  * @param fragmentShaderCode fragment shader source code to compile
  * @returns shaderProgram object, or null if failed.
  */
 function createShaderProgram(gl, vertexShaderCode, fragmentShaderCode)
 {
 	var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
	var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
	var shader = gl.createProgram();
    var count;
	
	gl.attachShader(shader, vertexShader);
	gl.attachShader(shader, fragmentShader);
	gl.linkProgram(shader);

	if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
		gl.deleteProgram(shader);
		gl.deteleShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}

    shader.attribute = {};
    shader.uniform = {};
	
	/* loop through all attributes and store then in the shader object as shader.attribute.string */
	count = gl.getProgramParameter(shader, gl.ACTIVE_ATTRIBUTES);
	for(var i = 0; i < count; i++) {
		var attrib = gl.getActiveAttrib(shader, i);
		shader.attribute[attrib.name] = gl.getAttribLocation(shader, attrib.name);
	}
	
	/* loop through all uniforms and store then in the shader object as shader.uniform.string */
	count = gl.getProgramParameter(shader, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < count; i++) {
		var uniform = gl.getActiveUniform(shader, i);
		shader.uniform[uniform.name] = gl.getUniformLocation(shader, uniform.name);
	}
	
    return shader;
 }

 function initGL(canvas)
 {
    var _gl;
    try {
        _gl = canvas.getContext("experimental-webgl") || canvas.getConext("webgl");     
    }
    catch(e) {}	

    if (!_gl) {
        alert("Could not initialise WebGL. Your browser may not support it");
		return null;
	}
		
     _gl.viewport(0,0, canvas.width, canvas.height);
	 //gl.clearDepth(1.0);
	 //gl.cullFace(gl.FRONT);
	 _gl.clearColor(0.0, 0.0, 0.0, 1.0);
     _gl.enable(_gl.DEPTH_TEST);
	 
	 return _gl;
 }

 function initBuffers(gl) 
 {
 	 var vertices = [
	    /* x,   y,   z,      u,   v */
		 2.0,  2.0,  0.0,   0.0, 0.0,
		-2.0,  2.0,  0.0,   1.0, 0.0,
		 2.0, -2.0,  0.0,   0.0, 1.0,
		-2.0, -2.0,  0.0,   1.0, 1.0,
	 ];

	 squareVertexPositionBuffer = gl.createBuffer();
	 gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
 }
 
 /*
 function initTerrainMesh(gl, heightMap)
 {
     var vertices = []
	 
     for (var x = 0; x < 512; x++) {
	     for (var z = 0; z < 512; z++) {
		     var vertex = [];
			 vertex[0] = x;
			 vertex[1] = heightMap[x,z];
			 vertex[2] = z;
			 vertex[3] = 0;
			 vertex[4] = 0;
			 vertices.push(vertex);
		 }
	 }
	 squareVertexPositionBuffer = gl.createBuffer();
	 gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
 }
 
 
 function loadTextures(gl)
 {
     //squareTexture = loadImage(gl, "terrain.png");
	 
 }
 
 function loadImage(gl, fileURL)
 {
     var image = new Image();
	 image.src = fileURL;
	 image.texture = null;
	 
	 image.onload = function(e) {
	     var texture = gl.createTexture();
       //  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
         gl.bindTexture(gl.TEXTURE_2D, texture);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
		 image.texture = texture;
	 }
	 return image; 
 }
 */
 
 function createTextureFromArray(gl, data, width, height)
 {
         var image = new Image();
         var texture = gl.createTexture();
      
         gl.bindTexture(gl.TEXTURE_2D, texture);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(data));
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);    
		 image.texture = texture;
		 
		 return image;
 }
 
 function drawFrame(gl) 
 {
    viewMatrix = camera.view;
	
	gl.useProgram(shaderProgram);
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
					
	gl.uniformMatrix4fv(shaderProgram.uniform.uPMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniform.uMVMatrix, false, viewMatrix);
	gl.uniform1i(shaderProgram.uniform.sampler, 0);
    if (squareTexture.texture) {
	    gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,squareTexture.texture);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	
	gl.enableVertexAttribArray(shaderProgram.attribute.position);
	gl.enableVertexAttribArray(shaderProgram.attribute.uv);
	
	gl.vertexAttribPointer(shaderProgram.attribute.position, 3, gl.FLOAT, false, 4*(3+2), 0);
    gl.vertexAttribPointer(shaderProgram.attribute.uv, 2, gl.FLOAT, false, 4*(3+2), 3*4);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
 }
 
 function tick() 
 {
	requestAnimFrame(tick);
	drawFrame(gl);
 }
 
 function main()
 {
    var canvas = document.getElementById("viewport");
		
    gl = initGL(canvas); 	
	
	projectionMatrix = mat4.create();
	viewMatrix = mat4.create();
	mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, projectionMatrix);
	
	shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
	
	initBuffers(gl);
	//loadTextures(gl);
	
	camera = Object.create(Camera).init(canvas);
	camera.position = [0.0, 0.0, 7.0];
	
	var heightMap = Object.create(DiamondSquare).init(513, 0).image;			  
	squareTexture = createTextureFromArray(gl, heightMap, 512,512);
	//initTerrainMesh(gl, heightMap);
		 
	requestAnimFrame(tick);
 }
 
 /* once the page has finished loading, kick off the main() function */
 window.addEventListener("load", main);