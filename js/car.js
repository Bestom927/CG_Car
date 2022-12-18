function Car(params) {
    var self = this;
    var car;
    var mtlLoader = new THREE.MTLLoader();

    var app = params.app;
    this.app = app;

    this.speed = 0;
    this.rSpeed = 0;
    this.run = false;
    this.acceleration = 0.1;
    this.deceleration = 0.04;
    this.maxSpeed = 2;
    this.map;

    this.light = params.light;

    this.lock = -1;
    this.isBrake = false;

    this.realRotation = 0; // 真实的旋转
    this.dirRotation = 0; // 方向上的旋转
    this.addRotation = 0; // 累计的旋转角度

    this.leftFront = {};
    this.leftBack = {};

    this.rightFront = {};
    this.rightBack = {};

    mtlLoader.setPath('./assets/');
    mtlLoader.load('ph.mtl', function (materials) {

        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('./assets/');
        objLoader.load('auto.obj', function (object) {
            car = object;
            car.children.forEach(function (item) {
                item.castShadow = true;
            });
            car.position.z = -20;
            car.position.y = -5;

            params.scene.add(car);
            self.car = car;

            params.cb();

        }, function () {
            console.log('progress');
        }, function () {
            console.log('error');
        });
    });

    self.frontRightWheel = new Wheel({
        mtl: 'front_wheel.mtl',
        obj: 'front_wheel.obj',
        parent: car,
        scene: params.scene,
        offsetX: 2.79475,
        offsetZ: -3.28386
    });

    self.frontLeftWheel = new Wheel({
        mtl: 'front_wheel.mtl',
        obj: 'front_wheel.obj',
        parent: car,
        scene: params.scene,
        offsetX: -2.79475,
        offsetZ: -3.28386
    });
}

Car.prototype.tick = function (params) {
    // 碰撞后的闪烁动画
    if (this.lock > 0) {
        this.lock--;
        if (this.lock % 2) {
            this.car.visible = false;
        } else {
            this.car.visible = true;
        }
        return;
    }

    if (this.run) {
        this.speed += this.acceleration;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
    } else {
        this.speed -= this.deceleration;
        if (this.speed < 0) {
            this.speed = 0;
        }
    }
    var speed = -this.speed;
    if (speed === 0) {
        return;
    }



    var time = Date.now();

    this.dirRotation += this.rSpeed;
    this.realRotation += this.rSpeed;

    var rotation = this.dirRotation;

    if (this.isBrake) {
        this.realRotation += this.rSpeed * (this.speed / 2);
    } else {
        if (this.realRotation !== this.dirRotation) {
            this.dirRotation += (this.realRotation - this.dirRotation) / 20000 * (this.speed) * (time - this.cancelBrakeTime);
        }
    }

    var speedX = Math.sin(rotation) * speed;
    var speedZ = Math.cos(rotation) * speed;


    var tempX = this.car.position.x + speedX;
    var tempZ = this.car.position.z + speedZ;
    /* 
    this.light.shadow.camera.left = (tempZ-50+20) >> 0;
    this.light.shadow.camera.right = (tempZ+50+20) >> 0;
    this.light.shadow.camera.top = (tempX+50) >> 0;
    this.light.shadow.camera.bottom = (tempX-50) >> 0;
    this.light.position.set(-120+tempX, 500, tempZ);
    this.light.shadow.camera.updateProjectionMatrix();*/

    this.light.position.set(-10 + tempX, 20, tempZ);
    this.light.shadow.camera.updateProjectionMatrix();

    // 动态获取汽车的左边
    var tempA = -(this.car.rotation.y + 0.523);
    this.leftFront.x = Math.sin(tempA) * 8 + tempX;
    this.leftFront.y = Math.cos(tempA) * 8 + tempZ;

    tempA = -(this.car.rotation.y + 2.616);
    this.leftBack.x = Math.sin(tempA) * 8 + tempX;
    this.leftBack.y = Math.cos(tempA) * 8 + tempZ;

    // var tempB = -(this.car.rotation.z + 0.523);
    // this.rightFront.x = Math.sin(tempB) * 8 + tempX;
    // this.rightFront.y = Math.cos(tempB) * 8 + tempZ;

    // tempB = -(this.car.rotation.z + 2.616);
    // this.rightBack.x = Math.sin(tempB) * 8 + tempX;
    // this.rightBack.y = Math.cos(tempB) * 8 + tempZ;

    console.log(this.leftFront, this.leftBack);
    console.log(this.rightFront, this.rightBack);
    var pos = this.car.position;
    console.log("car pos(x, y, z): ");
    console.log(pos.x, pos.y, pos.z);
    console.log(this.map);
    // end
    if (this.map === 2 && pos.x < -5163 && pos.x > -5165) {
        // if (pos.x < -5171 && pos.x > -5175) {
        // this.map === 2 && pos.x < 16 && pos.x > 13
        // window.alert("到达终点！")
        // console.log(this.app)
        // 假设此时停止计时
        this.app.$data.endTimeStamp = new Date().getTime();
        this.app.$data.visible = true;
        restartGame();
        return;
    } else if (this.map === 1 && pos.x < -5163 && pos.x > -5165) {
        // 假设此时停止计时
        this.app.$data.endTimeStamp = new Date().getTime();
        this.app.$data.visible = true;
        restartGame();
        return;
    }

    var collisionSide = this.physical();
    var correctedSpeed;
    if (collisionSide > -1) {
        correctedSpeed = this.collision(speedX, speedZ, collisionSide);



        speedX = correctedSpeed.vx * 5;
        speedZ = correctedSpeed.vy * 5;

        var angle = Math.atan2(-speedZ, speedX);

        this.realRotation = -1 * (Math.PI / 2 - angle);
        rotation = this.dirRotation = this.realRotation;

        this.speed = 0;
        this.reset();
    }


    this.car.rotation.y = this.realRotation;
    this.frontLeftWheel.wrapper.rotation.y = this.realRotation;
    this.frontRightWheel.wrapper.rotation.y = this.realRotation;
    this.frontLeftWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;
    this.frontRightWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;


    this.car.position.z += speedZ;
    this.car.position.x += speedX;

    this.frontLeftWheel.wrapper.position.z += speedZ;
    this.frontLeftWheel.wrapper.position.x += speedX;
    this.frontRightWheel.wrapper.position.z += speedZ;
    this.frontRightWheel.wrapper.position.x += speedX;


    params.camera.rotation.y = rotation;
    params.camera.position.x = this.car.position.x + Math.sin(rotation) * 20;
    params.camera.position.z = this.car.position.z + Math.cos(rotation) * 20;

};

Car.prototype.brake = function () {
    this.v = 10;

    this.isBrake = true;
};

Car.prototype.cancelBrake = function () {
    this.cancelBrakeTime = Date.now();
    this.isBrake = false;
};

Car.prototype.physical = function () {
    var i = 0;

    if (this.map === 1) {
        for (; i < outside1.length; i += 4) {
            if (isLineSegmentIntersect(this.leftFront, this.leftBack, {
                x: outside1[i],
                y: outside1[i + 1]
            }, {
                x: outside1[i + 2],
                y: outside1[i + 3]
            })) {
                console.log("physical");
                console.log(i);
                return i;
            }
            console.log(this.leftFront, this.leftBack);
        }
    }
    else if (this.map === 2) {
        for (; i < outside2.length; i += 4) {
            if (isLineSegmentIntersect(this.leftFront, this.leftBack, {
                x: outside2[i],
                y: outside2[i + 1]
            }, {
                x: outside2[i + 2],
                y: outside2[i + 3]
            })) {
                console.log("physical");
                console.log(i);
                return i;
            }
        }
    }


    return -1;
};

Car.prototype.reset = function () {
    this.lock = 60;
};

Car.prototype.collision = function (sx, sz, side) {
    var pos = this.car.position;
    if (this.map === 1) {
        var result = getBounceVector({
            p0: {
                x: pos.x,
                y: pos.z
            },
            p1: {
                x: pos.x + sx,
                y: pos.z + sz
            },
            vx: sx,
            vy: sz
        }, {
            p0: { x: outside1[side], y: outside1[side + 1] },
            p1: { x: outside1[side + 2], y: outside1[side + 3] },
            vx: outside1[side + 2] - outside1[side],
            vy: outside1[side + 3] - outside1[side + 1]
        });
        return result;
    }
    else if (this.map === 2) {
        var result = getBounceVector({
            p0: {
                x: pos.x,
                y: pos.z
            },
            p1: {
                x: pos.x + sx,
                y: pos.z + sz
            },
            vx: sx,
            vy: sz
        }, {
            p0: { x: outside2[side], y: outside2[side + 1] },
            p1: { x: outside2[side + 2], y: outside2[side + 3] },
            vx: outside2[side + 2] - outside2[side],
            vy: outside2[side + 3] - outside2[side + 1]
        });
        return result;
    }
};

function Wheel(params) {
    var mtlLoader = new THREE.MTLLoader();
    var self = this;

    mtlLoader.setPath('./assets/');
    mtlLoader.load(params.mtl, function (materials) {

        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('./assets/');
        objLoader.load(params.obj, function (object) {

            object.children.forEach(function (item) {
                item.castShadow = true;
            });
            var wrapper = new THREE.Object3D();
            wrapper.position.set(0, -5, -20);
            wrapper.add(object);

            object.position.set(params.offsetX, 0, params.offsetZ);

            params.scene.add(wrapper);
            self.wheel = object;
            self.wrapper = wrapper;

        }, function () {
            console.log('progress');
        }, function () {
            console.log('error');
        });
    });

}

function isLeft(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0;
}

function getBounceVector(obj, w) {
    var len = Math.sqrt(w.vx * w.vx + w.vy * w.vy);
    w.dx = w.vx / len;
    w.dy = w.vy / len;

    w.rx = -w.dy;
    w.ry = w.dx;

    w.lx = w.dy;
    w.ly = -w.dx;

    var projw = getProjectVector(obj, w.dx, w.dy);
    var projn;
    var left = isLeft(w.p0, w.p1, obj.p0);

    if (left) {
        projn = getProjectVector(obj, w.rx, w.ry);
    } else {
        projn = getProjectVector(obj, w.lx, w.ly);
    }
    projn.vx *= -0.5;
    projn.vy *= -0.5;

    return {
        vx: projw.vx + projn.vx,
        vy: projw.vy + projn.vy,
    };
}


function getProjectVector(u, dx, dy) {
    var dp = u.vx * dx + u.vy * dy;

    return {
        vx: (dp * dx),
        vy: (dp * dy)
    };
}

// 线和线的碰撞检测
function isLineSegmentIntersect(a, b, c, d) {
    // console.log("a, b : ");
    // console.log(a);
    // console.log(b);
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);

    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);

    if (area_abc * area_abd > 0) {
        return false;
    }

    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);

    var area_cdb = area_cda + area_abc - area_abd;
    if (area_cda * area_cdb > 0) {
        return false;
    }

    return true;
}

function restartGame(car) {
    car.position.x = -4;
    car.position.z = -15;
}