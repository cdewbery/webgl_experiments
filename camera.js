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

/**
 * A basic Camera class
 */
var Camera = Object.create(Object, {

    /* vector to store the rotational angles x,y,z */
	/* rotation around x (pitch), rotation around y (yaw), rotation around z (roll) */
    _angles: {
		writable : true,
	    value: null
	},
	
    angles: {
	    get: function() {
		    return this._angles;
		},
		set: function(value) {
		    this._angles = value;
			this._changed = true;
		}
	},
	
	/* vector to store the position, x,y,z */
	_position: {
		writable : true,
	    value: null
	},
	
	position: { 
	    get: function() {
		    return this._position;
		},
		set: function(value) {
		    this._position = value;
			this._changed = true;
		}
	},
	
	_changed: {
	    writable : true,
	    value: true
	},
	
	_view: {
	    writable : true,
	    value: null
	},
	
	view: {
	    get: function() {
		    if (this._changed) {
			    var mv = this._view;
				mat4.identity(mv);
				mat4.rotateX(mv, this.angles[0]);
				mat4.rotateZ(mv, this.angles[1]);
				mat4.rotateY(mv, this.angles[2]);
				/* simulate camera position at x,y,z by moving to -x,-y,-z */
				mat4.translate(mv, [-this.position[0], -this.position[1], -this.position[2]]);
				this._view = mv;
				this._changed = false;
			}
			return this._view;
		}
	},
	
	init: {
	    value: function(canvas) {
		    this.angles = vec3.create();
			this.position = vec3.create();
			this._view = mat4.create();
		//	this._camera = mat4.create();
			
		    return this;
		}
	},

});