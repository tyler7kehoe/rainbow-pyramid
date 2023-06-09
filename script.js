function start() {

    // Get canvas, WebGL context
    var canvas = document.getElementById("mycanvas");
    var gl = canvas.getContext("webgl");

    // Read shader source
    var vertexSource = document.getElementById("vertexShader").text;
    var fragmentSource = document.getElementById("fragmentShader").text;

    // Compile vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader,vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	alert(gl.getShaderInfoLog(vertexShader)); return null; }
    
    // Compile fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader,fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	alert(gl.getShaderInfoLog(fragmentShader)); return null; }
    
    // Attach the shaders and link
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Could not initialize shaders"); }
    gl.useProgram(shaderProgram);	    
    
    // with the vertex shader, we need to pass it positions
    // as an attribute - so set up that communication
    shaderProgram.PositionAttribute = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.enableVertexAttribArray(shaderProgram.PositionAttribute);
    
    shaderProgram.ColorAttribute = gl.getAttribLocation(shaderProgram, "vColor");
    gl.enableVertexAttribArray(shaderProgram.ColorAttribute);    
    
    // this gives us access to the matrix uniform
    shaderProgram.MVPmatrix = gl.getUniformLocation(shaderProgram,"uMVP");

    // Data ...
    
    // vertex positions
    var vertexPos = new Float32Array(
        [  // Front face
        0.0,  1.0,  0.0,
       -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
       // Right face
        0.0,  1.0,  0.0,
        1.0, -1.0,  1.0,
        1.0, -1.0, -1.0,
       // Back face
        0.0,  1.0,  0.0,
        1.0, -1.0, -1.0,
       -1.0, -1.0, -1.0,
       // Left face
        0.0,  1.0,  0.0,
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0]);

    // vertex colors
    var vertexColors = new Float32Array(
        [   // Front face
        0.0, 0.0, 1.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        // Right face
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        // Back face
        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        1.0, 0.0, 0.0,
        // Left face
        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0]);
    
    // element index array
    var triangleIndices = new Uint8Array(
        [  0, 1, 2,   0, 2, 3,    // front
           0, 3, 4,   0, 4, 5,    // right
           0, 5, 6,   0, 6, 7,
           0, 7, 8,   0, 8, 1,    // top
           1, 3, 5,   1, 5, 7]); // back

    // we need to put the vertices into a buffer so we can
    // block transfer them to the graphics hardware
    var trianglePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPos, gl.STATIC_DRAW);
    trianglePosBuffer.itemSize = 3;
    trianglePosBuffer.numItems = 12;
    
    // a buffer for colors
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexColors, gl.STATIC_DRAW);
    colorBuffer.itemSize = 3;
    colorBuffer.numItems = 12;

    // a buffer for indices
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);    

    var helper1 = -100;
    var helper2 = -200;

    // Scene (re-)draw routine
    function draw() {
	
        // Translate slider values to angles in the [-pi,pi] interval
        
        
        var angle1 = helper1*0.01*Math.PI;
        var angle2 = helper2*0.01*Math.PI;
        
        if (helper1 >= 100) {
            helper1 = -100;
        }
        else {
            helper1++;
        }

        if (helper2 >=200) {
            helper2 = -200;
        }
        else {
            helper2++;
        }

        // Circle around the y-axis
        var eye = [400*Math.sin(angle1),150.0,400.0*Math.cos(angle1)];
        var target = [0,0,0];
        var up = [0,1,0];
	
        var tModel = mat4.create();
        mat4.fromScaling(tModel,[100,100,100]);
        mat4.rotate(tModel,tModel,angle2,[1,1,2]);
	
        var tCamera = mat4.create();
        mat4.lookAt(tCamera, eye, target, up);      

        var tProjection = mat4.create();
        mat4.perspective(tProjection,Math.PI/4,1,10,1000);
	
        var tMVP = mat4.create();
        mat4.multiply(tMVP,tCamera,tModel); // "modelView" matrix
        mat4.multiply(tMVP,tProjection,tMVP);
	
        // Clear screen, prepare for rendering
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
        // Set up uniforms & attributes
        gl.uniformMatrix4fv(shaderProgram.MVPmatrix,false,tMVP);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(shaderProgram.ColorAttribute, colorBuffer.itemSize,
			       gl.FLOAT,false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, trianglePosBuffer);
        gl.vertexAttribPointer(shaderProgram.PositionAttribute, trianglePosBuffer.itemSize,
			       gl.FLOAT, false, 0, 0);

	// Do the drawing
        gl.drawElements(gl.TRIANGLES, triangleIndices.length, gl.UNSIGNED_BYTE, 0);

        window.requestAnimationFrame(draw);
    }


    window.requestAnimationFrame(draw);
}
window.onload=start;
