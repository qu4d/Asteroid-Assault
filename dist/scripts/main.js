let backgroundImage,
    
    backgroundSound,
    gameOverSound,
    laserSound,
    explosionSoundEffects = [],

    ship,
    asteroids = [],
    lasers,
    sticks,
    
    difficulty = 5,

    hud,
    scorePoints = 0,
    scorePointsHigh = 0,
    healthPoints = 100,
    levelNumber = 1,

    colors = [
        [248, 12, 18],  [238, 17, 0],   [255, 51, 17],
        [255, 68, 34],  [255, 102, 68], [255, 153, 51],
        [254, 174, 45], [204, 187, 51], [208, 195, 16],
        [170, 204, 34], [105, 208, 37], [34, 204, 170],
        [18, 189, 185], [17, 170, 187], [68, 68, 221],
        [51, 17, 187],  [59, 12, 189],  [68, 34, 153]
    ],

    input = {
        listeners: {},

        reset: function () {
            this.listeners = {};
        },

        registerAsListener: function (index, callback) {
            if (this.listeners[index] == undefined) {
                this.listeners[index] = [];
            }
    
            this.listeners[index].push(callback);
        },

        handleEvent: function (char, code, press) {
            if (this.listeners[code] != undefined) {
                for (let i = 0; i < this.listeners[code].length; i++) {
                    this.listeners[code][i](char, code, press);
                }
            }
        }
    };

function preload() {
    backgroundSound = loadSound('dist/sounds/main_theme.mp3');
    backgroundSound.setVolume(0.7);

    gameOverSound = loadSound('dist/sounds/game_over.wav');
    gameOverSound.setVolume(0.4);

    laserSound = loadSound('dist/sounds/pew.mp3');

    for (let i = 0; i < 3; i++){
        explosionSoundEffects[i] = loadSound('dist/sounds/explosion_'+i+'.mp3');
        explosionSoundEffects[i].setVolume(0.3);
    }
}

function setupReload() {
    ship.position = createVector(width / 2, height / 2);
    ship.head = 0;
    ship.rotation = 0;
    ship.speed = createVector(0, 0);
    ship.isBoosting = false;

    lasers = [];

    for (let i = 0; i < difficulty; i++) {
        asteroids.push(new Asteroid());
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    backgroundImage = loadImage('dist/images/space.jpg');
    backgroundSound.loop();

    ship = new Ship();
    hud = new Hud();
    sticks = new Sticks();

    setupReload();
}

function draw() {
    background(backgroundImage);

    if (asteroids.length == 0) {
        difficulty += 1;
        levelNumber += 1;
        hud.update();

        setupReload();
    }

    for (let i = 0; i < asteroids.length; i++) {
        if (ship.hits(asteroids[i])) {
            healthPoints -= 1;
            hud.update();
        }

        asteroids[i].render();
        asteroids[i].update();
        asteroids[i].edges();
    }

    if (healthPoints <= 0) {
        backgroundSound.stop();
        gameOverSound.play();

        asteroids = [];
        difficulty = 5;
        healthPoints = 100;
        levelNumber = 1;
        scorePoints = 0;

        setupReload();
        backgroundSound.play();
    }

    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].render();
        lasers[i].update();

        if (lasers[i].offscreen()) {
            lasers.splice(i, 1);
        } else {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (lasers[i].hits(asteroids[j])) {
                    asteroids[j].playSoundEffect(explosionSoundEffects);
                    scorePoints += 100;
                    hud.update();

                    if (asteroids[j].size > 15) {
                        let newAsteroids = asteroids[j].breakup();
                        asteroids = asteroids.concat(newAsteroids);
                    }

                    asteroids.splice(j, 1);
                    lasers.splice(i, 1);

                    break;
                }
            }
        }
    }

    if (scorePointsHigh < scorePoints) {
        scorePointsHigh = scorePoints;
        hud.update();
    }

    ship.render();
    ship.turn();
    ship.update();
    ship.edges();

    hud.render();

    sticks.render();
}

function keyPressed() {
    input.handleEvent(key, keyCode, true);

    if (keyCode == 77) {
        if (backgroundSound.isPlaying()) {
            backgroundSound.pause();
        } else {
            backgroundSound.play();
        }
    } else if (keyCode == 82) {
        asteroids = [];
        difficulty = 5;
        healthPoints = 100;
        levelNumber = 1;
        scorePoints = 0;
        
        setupReload();
    }
}

function keyReleased() {
    input.handleEvent(key, keyCode, false);
}

function mousePressed() {
    sticks.pressed();
}

function mouseReleased() {
    sticks.released();
}

class Ship {
    constructor() {
        this.position = createVector(width / 2, height / 2);
        this.size = 20;
        this.head = 0;
        this.rotation = 0;
        this.speed = createVector(0, 0);
        this.isBoosting = false;

        let scope = this;

        input.registerAsListener(32, function (char, code, press) {
            if (!press) {
                return;
            }

            lasers.push(new Laser(ship.position, ship.head));
            laserSound.play();
        });
        input.registerAsListener(RIGHT_ARROW, function (char, code, press) {
            scope.setRotation(press ? 0.1 : 0);
        });
        input.registerAsListener(LEFT_ARROW, function (char, code, press) {
            scope.setRotation(press ? -0.1 : 0);
        });
        input.registerAsListener(UP_ARROW, function (char, code, press) {
            scope.boosting(press ? true : false);
        });
    }

    boosting(b) {
        this.isBoosting = b;
    }

    update() {
        if (this.isBoosting) {
            this.boost();
        }

        this.position.add(this.speed);
        this.speed.mult(0.99);
    }

    boost() {
        let power = p5.Vector.fromAngle(this.head);
        power.mult(0.10);

        this.speed.add(power);
    }

    render() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.head + PI / 2);
        fill(10);
        stroke(255);
        triangle(-this.size + 10, this.size, this.size - 10, this.size, 0, -this.size);

        translate(0, 18)
        fill(210, 85, 90);
        noStroke();
        triangle(0, 2, 8, 8, -8, 8);
        pop();
    }

    edges() {
        if (this.position.x > width + this.size) {
            this.position.x = -this.size;
        } else if (this.position.x < -this.size) {
            this.position.x = width + this.size;
        }

        if (this.position.y > height + this.size) {
            this.position.y = -this.size;
        } else if (this.position.y < -this.size) {
            this.position.y = height + this.size;
        }
    }

    setRotation(angle) {
        this.rotation = angle;
    }

    turn() {
        this.head += this.rotation;
    }

    hits(asteroid) {
        let distance = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);

        if (distance < this.size + asteroid.size) {
            return true;
        } else {
            return false;
        }
    }
}

class Asteroid {
    constructor(position, size) {
        if (position) {
            this.position = position.copy();
        } else {
            this.position = createVector(random(width), random(height));
        }
    
        if (size) {
            this.size = size * 0.5;
        } else {
            this.size = random(15, 50);
        }
    
        this.speed = p5.Vector.random2D();
        this.sides = floor(random(5, 15));
        this.offset = [];
    
        for (let i = 0; i < this.sides; i++) {
            this.offset[i] = random(-this.size * 0.2, this.size * 0.2);
        }
    }

    render() {
        push();
        translate(this.position.x, this.position.y);
        fill(10);
        stroke(255);

        beginShape();
        for (let i = 0; i < this.sides; i++) {
            let angle = map(i, 0, this.sides, 0, TWO_PI);
            let x = (this.size + this.offset[i]) * cos(angle);
            let y = (this.size + this.offset[i]) * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    }

    update() {
        this.position.add(this.speed);
    }

    edges() {
        if (this.position.x > width + this.size) {
            this.position.x = -this.size;
        } else if (this.position.x < -this.size) {
            this.position.x = width + this.size;
        }

        if (this.position.y > height + this.size) {
            this.position.y = -this.size;
        } else if (this.position.y < -this.size) {
            this.position.y = height + this.size;
        }
    }

    breakup() {
        let newA = [];
        newA[0] = new Asteroid(this.position, this.size);
        newA[1] = new Asteroid(this.position, this.size);

        return newA;
    }

    playSoundEffect(soundArray) {
        let currentSound = soundArray[floor(random(0, soundArray.length))];
        currentSound.play();
    }
}

class Laser {
    constructor(startingPosition, angle) {
        this.position = createVector(startingPosition.x, startingPosition.y);
        this.speed = p5.Vector.fromAngle(angle);
        this.speed.mult(8);
        this.color = colors[floor(random(0, colors.length - 1))];
    }

    update() {
        this.position.add(this.speed);
    }

    render() {
        push();
        stroke(this.color[0], this.color[1], this.color[2]);
        strokeWeight(5);
        point(this.position.x, this.position.y);
        pop();
    }

    hits(asteroid) {
        let d = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);

        if (d < asteroid.size) {
            return true;
        } else {
            return false;
        }
    }

    offscreen() {
        if (this.position.x > width || this.position.x < 0) {
            return true;
        }

        if (this.position.y > height || this.position.y < 0) {
            return true;
        }

        return false;
    }
}

class Hud {
    constructor() {}

    render() {
        textSize(32);
        fill(255);
        text(scorePoints, 0, 62);
        text('Level ' + levelNumber, 0, 36);

        textSize(13);
        fill(255);
        text('High score ' + scorePointsHigh, 0, 80)

        push();
        fill(210, 85, 90);
        noStroke();
        rect(0, 0, width * (healthPoints / 100), 10);
        pop();
    }

    update() {
        textSize(32);
        fill(255);
        text(scorePoints, 0, 62);
        text('Level ' + levelNumber, 0, 36);

        push();
        rect(0, 0, width * (healthPoints / 100), 0);
        pop();
    }
}

class Sticks {
    constructor() {}

    render() {
        push();
        noFill();
        colorMode(RGB, 255, 255, 255, 1);
        strokeWeight(3);
        stroke(210, 85, 90, 0.2);
        ellipse(80, height-80, 100, 100);
        pop();

        push();
        noFill();
        colorMode(RGB, 255, 255, 255, 1);
        strokeWeight(3);
        stroke(210, 85, 90, 0.2);
        ellipse(width-80, height-80, 100, 100);
        pop();
    }

    pressed() {
        let distanceFromStickLeft = dist(mouseX, mouseY, 80, height-80),
            distanceFromStickRight = dist(mouseX, mouseY, width-80, height-80);

        if (distanceFromStickLeft < 50) {
            ship.setRotation(-0.1);
        } else if (distanceFromStickRight < 50) {
            ship.setRotation(0.1);
        } else {
            lasers.push(new Laser(ship.position, ship.head));
            laserSound.play();
    
            return false;
        }
    }

    released() {
        ship.setRotation(0);
    }
}