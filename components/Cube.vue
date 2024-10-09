<template>
  <canvas id="canvas" style="margin: auto">
    Your browser doesn't support canvas features.
  </canvas>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const windowWidth = window.innerWidth;
  const width = Math.min(windowWidth * 0.85, 600);
  const height = width;
  canvas.width = width;
  canvas.height = width;

  const fov = Math.PI / 3;
  const fovVertical = fov;
  const fovHorizontal = 2 * Math.atan((height * Math.tan(fov / 2)) / width);
  const worldVelocity = { x: 0, y: 0, z: 0, xrot: 0.1, yrot: 0.3, zrot: 0 };
  const worldTransform = { x: 0, y: 0, z: 6, xrot: 0, yrot: 0, zrot: 0 };
  const animationDuration = 50;

  //Easing function from:
  //http://gizma.com/easing/
  Math.easeInOutQuint = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t * t * t + b;
    t -= 2;
    return (c / 2) * (t * t * t * t * t + 2) + b;
  };

  let Point = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  };
  Point.prototype.project = function () {
    return new Point(
      width * (this.x / (this.z * 2 * Math.tan(fovVertical / 2)) + 1 / 2),
      height * (this.y / (this.z * 2 * Math.tan(fovHorizontal / 2)) + 1 / 2)
    );
  };
  Point.prototype.rotateX = function (theta) {
    return new Point(
      this.x,
      this.y * Math.cos(theta) - this.z * Math.sin(theta),
      this.y * Math.sin(theta) + this.z * Math.cos(theta)
    );
  };
  Point.prototype.rotateY = function (theta) {
    return new Point(
      this.x * Math.cos(theta) - this.z * Math.sin(theta),
      this.y,
      this.x * Math.sin(theta) + this.z * Math.cos(theta)
    );
  };
  Point.prototype.rotateZ = function (theta) {
    return new Point(
      this.x * Math.cos(theta) - this.y * Math.sin(theta),
      this.x * Math.sin(theta) + this.y * Math.cos(theta),
      this.z
    );
  };
  Point.prototype.translate = function (x, y, z) {
    return new Point(this.x + x, this.y + y, this.z + z);
  };

  let queue = [];
  let queueQuad = function (point0, point1, point2, point3, colour) {
    let averageZ = (point0.z + point1.z + point2.z + point3.z) / 4;
    let element = [
      colour,
      averageZ,
      point0.project(),
      point1.project(),
      point2.project(),
      point3.project(),
    ];
    if (queue.length === 0) queue[0] = element;
    else {
      queue[queue.length] = element;
      for (let x = queue.length - 2; x >= 0 && queue[x][1] < averageZ; x -= 1) {
        queue[x + 1] = queue[x];
        queue[x] = element;
      }
    }
  };
  let clearDrawQueue = function () {
    queue = [];
  };
  let drawQueue = function () {
    for (let x = 0; x < queue.length; x++) {
      ctx.fillStyle = queue[x][0];
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(queue[x][2].x, queue[x][2].y);
      for (let y = 3; y < queue[x].length; y++)
        ctx.lineTo(queue[x][y].x, queue[x][y].y);
      ctx.lineTo(queue[x][2].x, queue[x][2].y);
      ctx.fill();
      ctx.stroke();
    }
  };

  let faces = [
    [0, 1, 3, 2],
    [0, 4, 5, 1],
    [1, 5, 7, 3],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [4, 6, 7, 5],
  ];
  //White orange green red blue yellow grey(inner sides)
  let faceColours = [
    "#FFFFFF",
    "#0051BA",
    "#009E60",
    "#FF5800",
    "#C41E3A",
    "#FFD500",
    "#222",
  ];
  //"#FFFFFF","#C41E3A","#009E60","#0051BA","#FF5800","#FFD500"
  let Cube = function (xpos, ypos, zpos, rotx, roty, rotz) {
    this.x = xpos;
    this.y = ypos;
    this.z = zpos;
    this.rotx = rotx;
    this.roty = roty;
    this.rotz = rotz;

    this.faceMatrix = [0, 1, 2, 3, 4, 5];

    if (xpos < 1) this.faceMatrix[5] = 6;
    if (xpos >= 0) this.faceMatrix[0] = 6;
    if (ypos < 1) this.faceMatrix[3] = 6;
    if (ypos >= 0) this.faceMatrix[1] = 6;
    if (zpos < 1) this.faceMatrix[2] = 6;
    if (zpos >= 0) this.faceMatrix[4] = 6;

    this.points = [];
    for (let x = -0.5; x <= 0.5; x++)
      for (let y = -0.5; y <= 0.5; y++)
        for (let z = -0.5; z <= 0.5; z++) this.points.push(new Point(x, y, z));
  };
  Cube.prototype.queue = function () {
    for (let x = 0; x < 6; x++) {
      let quad = [];
      for (let y = 0; y < 4; y++) {
        let point = this.points[faces[x][y]];
        point = point
          .translate(this.x, this.y, this.z)
          .rotateX(this.rotx)
          .rotateY(this.roty)
          .rotateZ(this.rotz)
          .rotateX(worldTransform.xrot)
          .rotateY(worldTransform.yrot)
          .rotateZ(worldTransform.zrot)
          .translate(worldTransform.x, worldTransform.y, worldTransform.z);
        quad.push(point);
      }
      queueQuad(
        quad[0],
        quad[1],
        quad[2],
        quad[3],
        faceColours[this.faceMatrix[x]]
      );
    }
  };
  Cube.prototype.rotateColours = function (xrot, yrot, zrot) {
    for (let x = 0; x < xrot; x++)
      this.faceMatrix = [
        this.faceMatrix[0],
        this.faceMatrix[2],
        this.faceMatrix[3],
        this.faceMatrix[4],
        this.faceMatrix[1],
        this.faceMatrix[5],
      ];
    for (let x = 0; x < yrot; x++)
      this.faceMatrix = [
        this.faceMatrix[2],
        this.faceMatrix[1],
        this.faceMatrix[5],
        this.faceMatrix[3],
        this.faceMatrix[0],
        this.faceMatrix[4],
      ];
    for (let x = 0; x < zrot; x++)
      this.faceMatrix = [
        this.faceMatrix[3],
        this.faceMatrix[0],
        this.faceMatrix[2],
        this.faceMatrix[5],
        this.faceMatrix[4],
        this.faceMatrix[1],
      ];
  };

  let slices = [
    [2, 1, 0, 5, 4, 3, 8, 7, 6],
    [11, 10, 9, 14, 13, 12, 17, 16, 15],
    [20, 19, 18, 23, 22, 21, 26, 25, 24],
    [2, 1, 0, 11, 10, 9, 20, 19, 18],
    [5, 4, 3, 14, 13, 12, 23, 22, 21],
    [8, 7, 6, 17, 16, 15, 26, 25, 24],
    [6, 3, 0, 15, 12, 9, 24, 21, 18],
    [7, 4, 1, 16, 13, 10, 25, 22, 19],
    [8, 5, 2, 17, 14, 11, 26, 23, 20],
  ];

  let Rubiks = function () {
    this.cubies = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
          this.cubies.push(new Cube(x, y, z, 0, 0, 0));
  };
  Rubiks.prototype.queue = function () {
    if (this.animationTimer > 0) this.updateAnimation();
    else if (this.animationTimer == 0) {
      this.endAnimation();
      this.fixColours();
      this.startAnimation();
    } else if (!this.animationTimer) this.startAnimation();
    for (let x = 0; x < this.cubies.length; x++) {
      this.cubies[x].queue();
    }
  };
  Rubiks.prototype.startAnimation = function () {
    this.slice = parseInt(Math.random() * 9);
    this.rotationAmount = parseInt(Math.random() * 2) + 1;
    if (Math.random() * 2 > 1) this.rotationAmount *= -1;
    this.animationTimer = animationDuration;
  };
  Rubiks.prototype.updateAnimation = function () {
    this.animationTimer--;
    let currentRotation = Math.easeInOutQuint(
      animationDuration - this.animationTimer,
      0,
      (this.rotationAmount * Math.PI) / 2,
      animationDuration
    );
    for (let x = 0; x < 9; x++) {
      if (this.slice < 3)
        this.cubies[slices[this.slice][x]].rotx = currentRotation;
      else if (this.slice < 6)
        this.cubies[slices[this.slice][x]].roty = currentRotation;
      else this.cubies[slices[this.slice][x]].rotz = currentRotation;
    }
  };
  Rubiks.prototype.endAnimation = function () {
    let value = this.rotationAmount;
    if (value == -1) value = 3;
    else if (value == -2) value = 2;

    for (let x = 0; x < 9; x++) {
      if (this.slice < 3)
        this.cubies[slices[this.slice][x]].rotateColours(value, 0, 0);
      else if (this.slice < 6)
        this.cubies[slices[this.slice][x]].rotateColours(0, value, 0);
      else this.cubies[slices[this.slice][x]].rotateColours(0, 0, value);

      this.cubies[slices[this.slice][x]].rotx = 0;
      this.cubies[slices[this.slice][x]].roty = 0;
      this.cubies[slices[this.slice][x]].rotz = 0;
    }
  };
  Rubiks.prototype.fixColours = function () {
    let value = this.rotationAmount;
    if (value == -1) value = 3;
    else if (value == -2) value = 2;

    for (let x = 0; x < value; x++) {
      let temp = this.cubies[slices[this.slice][0]].faceMatrix.slice();
      this.cubies[slices[this.slice][0]].faceMatrix =
        this.cubies[slices[this.slice][6]].faceMatrix.slice();
      this.cubies[slices[this.slice][6]].faceMatrix =
        this.cubies[slices[this.slice][8]].faceMatrix.slice();
      this.cubies[slices[this.slice][8]].faceMatrix =
        this.cubies[slices[this.slice][2]].faceMatrix.slice();
      this.cubies[slices[this.slice][2]].faceMatrix = temp.slice();

      temp = this.cubies[slices[this.slice][1]].faceMatrix.slice();
      this.cubies[slices[this.slice][1]].faceMatrix =
        this.cubies[slices[this.slice][3]].faceMatrix.slice();
      this.cubies[slices[this.slice][3]].faceMatrix =
        this.cubies[slices[this.slice][7]].faceMatrix.slice();
      this.cubies[slices[this.slice][7]].faceMatrix =
        this.cubies[slices[this.slice][5]].faceMatrix.slice();
      this.cubies[slices[this.slice][5]].faceMatrix = temp.slice();
    }
  };

  let main = new Rubiks();

  let draw = function () {
    ctx.clearRect(0, 0, width, height);

    worldTransform.x += worldVelocity.x;
    worldTransform.y += worldVelocity.y;
    worldTransform.z += worldVelocity.z;
    worldTransform.xrot += worldVelocity.xrot + 0.005;
    worldTransform.yrot += worldVelocity.yrot + 0.01;
    worldTransform.zrot += worldVelocity.zrot;

    worldVelocity.xrot /= 1.03;
    worldVelocity.yrot /= 1.06;

    clearDrawQueue();
    //queue shit here
    main.queue();
    drawQueue();

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
});
</script>
