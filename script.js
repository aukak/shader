function getContext3d(canvasObj, fragmentShaderScript, vertextShaderScript) {
  const context = canvasObj.getContext("webgl2");
  const w = window.innerWidth;
  const h = window.innerHeight;

  context.bindBuffer(context.ARRAY_BUFFER, context.createBuffer());
  context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), context.STATIC_DRAW);

  const program = context.createProgram();
  const vshader = context.createShader(context.VERTEX_SHADER);
  const fshader = context.createShader(context.FRAGMENT_SHADER);

  context.shaderSource(vshader, vertextShaderScript || `precision mediump float;
    attribute vec2 a_texcoord;
    attribute vec2 a_position;
    varying vec2 v_texcoord;
    void main(){
      v_texcoord = a_texcoord;
      gl_Position = vec4(a_position, 0, 1);
    }`);
  context.shaderSource(fshader, fragmentShaderScript);
  context.compileShader(vshader);
  context.compileShader(fshader);

  context.attachShader(program, vshader);
  context.attachShader(program, fshader);
  context.linkProgram(program);
  context.useProgram(program);

  // Vérification que le programme est correctement lié
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', context.getProgramInfoLog(program));
    return null;
  }

  const positionLocation = context.getAttribLocation(program, "a_position");
  context.enableVertexAttribArray(positionLocation);
  context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0);

  const texcoordLocation = context.getAttribLocation(program, "a_texcoord");
  context.enableVertexAttribArray(texcoordLocation);
  context.vertexAttribPointer(texcoordLocation, 2, context.FLOAT, false, 0, 0);

  context.uniform2f(context.getUniformLocation(program, "resolution"), w, h);
  context.viewport(0, 0, w, h);

  context.program = program;  // Stockage du programme WebGL dans le contexte

  context.setUniform2F = (name, val) => context.uniform2f(context.getUniformLocation(context.program, name), ...val);

  context.update = (time = performance.now() * .001) => {
    context.uniform1f(context.getUniformLocation(context.program, "time"), time);
    context.drawArrays(context.TRIANGLES, 0, 6);
  };

  return context;
}

const canvas = document.createElement("canvas");
const ctx3d = getContext3d(canvas, fragmentShader.innerText);

canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.imageRendering = 'high-quality';
document.body.prepend(canvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx3d.viewport(0, 0, canvas.width, canvas.height); // Mettre à jour le viewport WebGL
  ctx3d.uniform2f(ctx3d.getUniformLocation(ctx3d.program, "resolution"), canvas.width, canvas.height); // Mettre à jour la résolution

  ctx3d.update(); // Met à jour le contexte 3D avec les nouvelles dimensions
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

(function animate(t = 0) {
  ctx3d.update();
  requestAnimationFrame(animate);
})(0);

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen(); // Sortir du plein écran
  } else {
    document.documentElement.requestFullscreen(); // Passer en plein écran
  }
}

document.body.addEventListener('click', () => {
  toggleFullscreen();
  resizeCanvas(); 
  
});