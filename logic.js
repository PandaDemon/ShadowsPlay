//Based on https://www.redblobgames.com/articles/visibility/

var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Targets light rays point to
var vertices = [];
//Objects that cast shadows
var barriers = [];
//Light sources
var lights = [];
//Limits of the canvas
var corners = [];

var TWO_PI = 2 * Math.PI;

//Ray intersection with canvas limits
var maxlimits = [];
//Closest collision points for all rays
var minlimits = [];
//Small value between rays cast around vertices
var epsilon = 1;
//Collision point 
var p_;
var mouse_pos_x = 2;
var mouse_pos_y = 2;


var animate = true;
//Is mouse being pressed down
var drag = false;
//Index of light being dragged around
var active_light = -1;

function dist(a, b){
  return Math.sqrt(a*a + b*b);
}

canvas.addEventListener('mouseleave', animate_);
canvas.addEventListener('mousemove', mouse_track);

canvas.addEventListener('mousedown', mouse_down);
canvas.addEventListener('mouseup', mouse_up);

function animate_(){
  animate = true;
}
function mouse_track(event) {
  mouse_pos_x = event.clientX;
  mouse_pos_y = event.clientY;
  if(drag){
    animate = false;
    if(active_light != -1){
      lights[active_light].x = mouse_pos_x;
      lights[active_light].y = mouse_pos_y;
    }
  }
}
function mouse_down(event) {

  drag = true;
  mouse_pos_x = event.clientX;
  mouse_pos_y = event.clientY;
  active_light = -1;
  for(l = 0; l < lights.length; l++){
    if(dist(mouse_pos_x - lights[l].x, mouse_pos_y - lights[l].y) < 20){
      active_light = l;
      break;
    }
  }
}

function mouse_up(event) {
  drag = false;
}

var green = {
  x: canvas.width/2+200,
  y: canvas.height/4,
  radius: Math.max(canvas.height, canvas.width)/2,
  colour_1: "rgba(153, 255, 153, 1)",
  colour_2: "rgba(0, 153, 51, 0.1)"
}
lights.push(green);

var blue = {
  x: canvas.width/2-200,
  y: canvas.height/4,
  radius: Math.max(canvas.height, canvas.width)/2,
  colour_1: "rgba(0,255,255,1)",
  colour_2: "rgba(0,0,255,0.01)"
}
lights.push(blue);

var purple = {
  x: canvas.width/2,
  y: canvas.height/2,
  radius: Math.max(canvas.height, canvas.width)/2,
  colour_1: "rgba(204, 0, 204, 1)",
  colour_2: "rgba(102,0,204, 0.1)"
}
lights.push(purple);

function n_x(x1, y1, x2, y2) {
  return -(y2 - y1) / dist(x2 - x1, y2 - y1);
}

function n_y(x1, y1, x2, y2) {
  return (x2 - x1) / dist(x2 - x1, y2 - y1);
};

//Is point on the same side of all rectangle sides
function point_in_rectangle(x, y, r){
  var inside = true;
  var nx = n_x(r.x, r.y, r.x+r.width, r.y);
  var ny = n_y(r.x, r.y, r.x+r.width, r.y);
  var distance = ((r.x - x) * nx + (r.y - y) * ny);
  if(distance > epsilon){
    inside = false;
  }
  nx = n_x(r.x+r.width, r.y, r.x+r.width, r.y+r.height);
  ny = n_y(r.x+r.width, r.y, r.x+r.width, r.y+r.height);
  distance = ((r.x+r.width - x) * nx + (r.y - y) * ny);
  if(distance > epsilon){
    inside = false;
  }
  nx = n_x(r.x+r.width, r.y+r.height, r.x, r.y+r.height);
  ny = n_y(r.x+r.width, r.y+r.height, r.x, r.y+r.height);
  distance = ((r.x+r.width - x) * nx + (r.y+r.height - y) * ny);
  if(distance > epsilon){
    inside = false;
  }
  nx = n_x(r.x, r.y+r.height, r.x, r.y);
  ny = n_y(r.x, r.y+r.height, r.x, r.y);
  distance = ((r.x - x) * nx + (r.y+r.height - y) * ny);
  if(distance > epsilon){
    inside = false;
  }
  return inside;
}

var barrierCount = 30;
var seeds = [];
var delta = Math.min(canvas.width, canvas.height)/(barrierCount/2);

//Area to be kept clear for light sources
var clear_area = {x: (canvas.width/2-100)-2*delta, y: (canvas.height/2-40)-2*delta, width: 300+2*delta, height: 120+2*delta};

//Generate random positions in the free space of the canvas
while(seeds.length < barrierCount){
  var seed = {
    x: Math.random() * (canvas.width-delta-delta) + delta,
    y: Math.random() * (canvas.height-delta-delta) + delta,
    radius: delta
  };
  //If seed outside the clear area
  if(!point_in_rectangle(seed.x, seed.y, clear_area)){
    seeds.push(seed);
  }
}

for(s = 0; s < seeds.length-1; s++){
  for(n = s+1; n < seeds.length; n++){
    var distance = dist(seeds[s].x - seeds[n].x, seeds[s].y - seeds[n].y);
    if((distance/2) < seeds[s].radius){
      seeds[s].radius = distance/2;
    }if((distance/2) < seeds[n].radius){
      seeds[n].radius = distance/2;
    }
  }
}

//Create random regular polygons
for (i = 0; i < barrierCount; i++) {
  var a = seeds[i].x;
  var b = seeds[i].y;
  //Pick vertex count between 2-8
  var point_count_ = Math.round(Math.random() * (9-3) + 3);
  //Pick a random offset to make polygons randomly rotated
  var offset = Math.random() * Math.PI;
  //Divide a circle into equal size sections
  var step = TWO_PI/point_count_;
  var points_ = [];
  //Travel along circle and place polygon vertices
  for(p = 0; p < point_count_; p++){
    var point = {
      x_: a - (seeds[i].radius * Math.cos(step*p + offset)),
      y_: b + (seeds[i].radius * Math.sin(step*p + offset))
    };
    points_.push(point);
  }
  //Create barrier
  var barrier = {
    x: a,
    y: b,
    point_count: point_count_,
    points: points_
  };
  barriers.push(barrier);
}

//Determine if a ray and a line segment intersect, and if so, determine the collision point
function getIntersection(x1, y1, x2, y2, x3, y3, x4, y4){
  var denom = ((x2 - x1)*(y4 - y3)-(y2 - y1)*(x4 - x3));
  var r;
  var s;
  var x;
  var y;
  var b = false;

  //If lines not collinear or parallel
  if(denom != 0){
    //Intersection in ray "local" coordinates
    r = (((y1 - y3) * (x4 - x3)) - (x1 - x3) * (y4 - y3)) / denom;

    //Intersection in segment "local" coordinates
    s = (((y1 - y3) * (x2 - x1)) - (x1 - x3) * (y2 - y1)) / denom;

    //The algorithm gives the intersection of two infinite lines, determine if it lies on the side that the ray is defined on
    if (r >= 0)
    {
      //If point along the line segment
      if (s >= 0 && s <= 1)
      {
        b = true;
        //Get point coordinates (offset by r local units from start of ray)
        x = x1 + r * (x2 - x1);
        y = y1 + r * (y2 - y1);
      }
    }
  }
  var p = [b,x,y];
  return p;
}


function draw() {

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  //Keep lights within window
  for (i = 0; i < lights.length; i++) {
    if (lights[i].x < 20) {
      lights[i].x = 20;
    }
    if (lights[i].y < 20) {
      lights[i].y = 20;
    }
    if (lights[i].x > canvas.width - 20) {
      lights[i].x = canvas.width - 20;
    }
    if (lights[i].y > canvas.height - 20) {
      lights[i].y = canvas.height - 20;
    }
  }

  corners = [{x: 0, y: 0}, {x: canvas.width, y:0}, {x:canvas.width, y:canvas.height}, {x:0, y:canvas.height}];

  //Add the corners of the domain to the vertex array to construct rays to them
  vertices.push(corners[0]);
  vertices.push(corners[1]);
  vertices.push(corners[2]);
  vertices.push(corners[3]);


  //Add all the vertices of the barriers to an array to construct rays to them from the light source
  for (i = 0; i < barriers.length; i++) {
    for (j = 0; j < barriers[i].point_count; j++) {
      var vertex = {
        x: barriers[i].points[j].x_,
        y: barriers[i].points[j].y_
      };
      vertices.push(vertex);
      //Add two extra vertices slightly offset from the original one to track rays past corners. 
      //TODO: Correct offset for perfectly diagonal barrier sides
      vertex = {
        x: barriers[i].points[j].x_+epsilon,
        y: barriers[i].points[j].y_+epsilon
      };
      vertices.push(vertex);
      vertex = {
        x: barriers[i].points[j].x_-epsilon,
        y: barriers[i].points[j].y_-epsilon
      };
      vertices.push(vertex);
    }
  }

  //Draw the barriers
  //Barrier colour
  ctx.fillStyle = "#544";
  for (i = 0; i < barriers.length; i++) {
    ctx.beginPath();
    for (j = 0; j < barriers[i].point_count; j++) {
      ctx.lineTo(barriers[i].points[j].x_, barriers[i].points[j].y_);
    }
    ctx.fill();
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  //For all light sources
  for(l = 0; l < lights.length; l++){

    //Corners themselves are the collision points of their rays with the domain boundaries
    maxlimits.push([true, corners[0].x, corners[0].y]);
    maxlimits.push([true, corners[1].x, corners[1].y]);
    maxlimits.push([true, corners[2].x, corners[2].y]);
    maxlimits.push([true, corners[3].x, corners[3].y]);
    //For all rays to boundary vertices (exluding the first 4 vertices which are the corners of the domain)
    for (r = 4; r < vertices.length; r++) {

      //For all canvas boundaries: add maximum intersection points at the edges of the canvas       
      p_ = getIntersection(lights[l].x, lights[l].y, vertices[r].x, vertices[r].y, 0, 0, canvas.width, 0);
      if(p_[0]){
        maxlimits.push(p_);
      }
      p_ = getIntersection(lights[l].x, lights[l].y, vertices[r].x, vertices[r].y, canvas.width, 0, canvas.width, canvas.height);
      if(p_[0]){
        maxlimits.push(p_);
      }
      p_ = getIntersection(lights[l].x, lights[l].y, vertices[r].x, vertices[r].y, canvas.width, canvas.height, 0, canvas.height);
      if(p_[0]){
        maxlimits.push(p_);
      }
      p_ = getIntersection(lights[l].x, lights[l].y, vertices[r].x, vertices[r].y, 0, canvas.height, 0, 0);
      if(p_[0]){
        maxlimits.push(p_);
      }
    }


    //For all rays
    for (r = 0; r < vertices.length; r++) {
      //Initialise collision point to be the ray's intersection with the edge of the canvas
      var min_p = [maxlimits[r][1], maxlimits[r][2]];
      //For all barriers
      for (i = 0; i < barriers.length; i++) {
        //For all barrier sides
        for (j = 0; j < barriers[i].point_count; j++) {
          //Determine if ray hits a side
          p_ = getIntersection(lights[l].x, lights[l].y, vertices[r].x, vertices[r].y, barriers[i].points[j].x_, barriers[i].points[j].y_, barriers[i].points[(j+1)%barriers[i].point_count].x_, barriers[i].points[(j+1)%barriers[i].point_count].y_);

          //If it hits a side
          if(p_[0]){

            //If distance to new collision point is smaller than the temporary one
            if(dist(lights[l].x - p_[1], lights[l].y - p_[2]) < dist(lights[l].x - min_p[0], lights[l].y- min_p[1])){
              //Set temporary value to new value
              min_p[0] = p_[1];
              min_p[1] = p_[2];
            }
          }
        }
      }
      //Record the closest collision point for a ray
      minlimits.push(min_p);
    }

    //Sort the ray collision points in a clockwise order by determining the angle between the rays and the X axis
    minlimits.sort(function sort_angles(a, b){
      return Math.atan2(a[0] - lights[l].x, a[1] - lights[l].y) - Math.atan2(b[0] - lights[l].x, b[1] - lights[l].y);
    }); 

    //Create gradient
    var grd = ctx.createRadialGradient(lights[l].x, lights[l].y,10,lights[l].x, lights[l].y, Math.max(canvas.width, canvas.height)/2);
    grd.addColorStop(0, lights[l].colour_1);
    grd.addColorStop(0.75, lights[l].colour_2);
    //Background colour
    grd.addColorStop(1,"rgba(17,17,34,0.01)");
    ctx.fillStyle = grd;

    //Visit all collision points in order and fill the circumscribed area with a gradient
    ctx.beginPath();
    ctx.moveTo(minlimits[0][0], minlimits[0][1]);
    for (i = 0; i < minlimits.length; i++) { 
      ctx.lineTo(minlimits[i][0], minlimits[i][1]);
    }
    ctx.moveTo(minlimits[0][0], minlimits[0][1]);
    ctx.fill(); 

    //Draw the rays
    //Set 'true' to view rays
    if(false){
      ctx.strokeStyle = 'rgb(255,0,0)';
      ctx.beginPath();
      ctx.moveTo(minlimits[0][0], minlimits[0][1]);
      for (i = 0; i < minlimits.length; i++) {  
        ctx.moveTo(lights[l].x, lights[l].y);
        ctx.lineTo(minlimits[i][0], minlimits[i][1]);
      }
      ctx.moveTo(minlimits[0][0], minlimits[0][1]);
      ctx.stroke(); 
    }
    //Empty arrays
    minlimits = [];
    maxlimits = [];
  }
  ctx.restore();

  //Display a circle around light sources when the cursor is within a certain distance
  for(l = 0; l < lights.length; l++){
    if(dist(mouse_pos_x - lights[l].x, mouse_pos_y - lights[l].y) < 200){
      ctx.strokeStyle = 'rgb(0,0,0)';
      ctx.beginPath();
      ctx.arc(lights[l].x, lights[l].y, 20, 0, TWO_PI);
      ctx.stroke(); 
    }
  }

  //Empty arrays
  vertices = [];
  corners = [];

  window.requestAnimationFrame(draw);
}
window.requestAnimationFrame(draw);