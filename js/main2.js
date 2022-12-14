var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = 0;
camera.position.x = 0;
camera.speed = {
    z: 0,
    x: 0
};

var webGLRenderer = new THREE.WebGLRenderer();

webGLRenderer.setPixelRatio(window.devicePixelRatio);
webGLRenderer.setSize(window.innerWidth, window.innerHeight);
webGLRenderer.setClearColor(0x0077ec, 1);
webGLRenderer.shadowMap.enabled = true;
webGLRenderer.shadowMap.type = THREE.PCFShadowMap;


var pointLight = new THREE.PointLight(0xccbbaa, 1, 0, 0);
pointLight.position.set(-10, 20, -20);
pointLight.castShadow = true;

scene.add(pointLight);

/*var dirLight = new THREE.DirectionalLight(0xccbbaa, 0.5, 100);
dirLight.position.set(-120, 500, -0);
dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 1000;
dirLight.shadow.mapSize.height = 1000;

dirLight.shadow.camera.near = 2;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;

scene.add(dirLight);*/

var light = new THREE.AmbientLight(0xccbbaa, 0.1);
scene.add(light);

document.body.appendChild(webGLRenderer.domElement);



function Ground() {
    var meshBasicMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    var objLoader = new THREE.OBJLoader();

    objLoader.setPath('./assets/');
    objLoader.load('ground.obj', function (object) {
        object.children.forEach(function (item) {
            item.receiveShadow = true;
        });
        object.position.y = -5;


        scene.add(object);

    }, function () {
        console.log('progress');
    }, function () {
        console.log('error');
    });
}

document.body.addEventListener('keydown', function (e) {
    // console.log(e.keyCode);
    switch (e.keyCode) {
        case 87: // w
            car.run = true;
            break;
        case 65: // a
            car.rSpeed = 0.02;
            break;
        case 68: // d
            car.rSpeed = -0.02;
            break;
        case 32: // space
            car.brake();
            break;
    }
});

document.body.addEventListener('keyup', function (e) {
    switch (e.keyCode) {
        case 87: // w
            car.run = false;
            break;
        case 65: // a
            car.rSpeed = 0;
            break;
        case 68: // d
            car.rSpeed = 0;
            break;
        case 32: // space
            car.cancelBrake();
            break;
    }
});

var car = new Car({
    scene: scene,
    cb: start,
    light: pointLight
});

var ground;

function start() {
    ground = new Ground({
        scene: scene
    });

    render();
}

function render() {
    car.tick();

    requestAnimationFrame(render);
    webGLRenderer.render(scene, camera);
}

