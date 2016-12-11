class Victory extends Phaser.State {

    constructor() {
        super();
    }

    create() {
        var styleBig = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
        var styleSmall = { font: "bold 18px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };

        //add background image
        this.background = this.game.add.sprite(0,0,'background-menu');
        this.background.height = this.game.height;
        this.background.width = this.game.width;
        this.background.alpha = 0.25;

        // Ajout texte
        if (this.game.global.level.current >= this.game.global.level.max) {
            var img = this.game.add.sprite(this.game.centerX, 100, 'finished');
        } else {
            var img = this.game.add.sprite(this.game.centerX, 100, 'victory');
        }
        img.anchor.set(0.5);
        img.fixedToCamera = true;

        // Ajout du bonus de temps
        this.config = this.game.cache.getJSON('level-'+this.game.global.level.current+'-config');
        var bestTime = this.config.bestTime || 40;
        var playerTime = (this.game.global.level.elapsedTime<bestTime)?bestTime:this.game.global.level.elapsedTime;
        var bonusTemps = Math.floor(bestTime * 1000 / playerTime);
        console.log('bestTime : ' + bestTime + ', ' + playerTime + ', bonus: ' + bonusTemps);
        this.game.global.score += bonusTemps;
        // Ajout du bonus de vie
        this.game.global.score += 50 * this.game.global.player.life;
        // Ajout du score
        this.score = this.game.add.text(this.game.centerX, this.computePos(2),
            this.game.global.score + ' points', styleBig);
        this.score.anchor.set(0.5);

        // ajout des vies restantes
        for (var i=0; i<this.game.global.player.life; i++) {
            var sprite = this.game.add.sprite(this.game.centerX - 30 + 30*i, this.computePos(3), 'heartFull');
            sprite.scale.setTo(0.5);
            sprite.anchor.setTo(0.5);
        }
        for (;i<this.game.global.player.maxlife;i++) {
            sprite = this.game.add.sprite(this.game.centerX - 30 + 30*i, this.computePos(3), 'heartEmpty');
            sprite.scale.setTo(0.5);
            sprite.anchor.setTo(0.5);
        }

        // Ajout personnage qui saute
        var sprite = this.game.add.sprite(this.game.centerX, this.game.centerY + 50, this.game.global.player.sprite, 'idle/01.png');
        sprite.anchor.set(0.5);
        sprite.animations.add('jump', Phaser.Animation.generateFrameNames('jump/', 1, 10, '.png', 2), 10, true, false);
        sprite.animations.play('jump');
        this.game.camera.follow(sprite);

        // Ajout temps écoulé
        this.time = this.game.add.text(this.game.centerX, this.game.centerY + 200,
            this.game.global.level.elapsedTime + ' seconde' + ((this.game.global.level.elapsedTime>1)?'s':''), styleSmall);
        this.time.anchor.set(0.5);

        // Ajout résumé des bonus
        var curPos = 10; i=1;
        this.game.global.player.collected.forEach(function(bonus) {
            sprite = this.game.add.sprite(this.computePos(curPos, i) - 24, this.computePos(curPos), bonus.sprite, bonus.frame);
            if (bonus.scale) {
                sprite.scale.setTo(bonus.scale*0.7);
            } else {
                sprite.scale.setTo(0.7);
            }
            sprite.anchor.setTo(0.5);
            this.game.add.text(this.computePos(curPos, i) + 24, this.computePos(curPos), bonus.count, styleSmall).anchor.set(0.5);
            if (i%3 == 0) {
                curPos++;
                i = 1;
            } else {
                i++;
            }
        }, this);

        // Lecture du son dédié à l'écran
        this.game.add.audio('winnerSound').play();

        //prevent accidental click-thru by not allowing state transition for a short time
        this.canContinueToNextState = false;
        this.game.time.events.add(Phaser.Timer.SECOND*0.25, function(){ this.canContinueToNextState = true; }, this);

        this.game.commun.saveScore();
        this.game.global.scoreLastLevel = this.game.global.score;
        var oldMaxLevel = localStorage.getItem('playerMaxLevel');
        if (!oldMaxLevel || parseInt(oldMaxLevel) < this.game.global.level.current+1) {
            localStorage.setItem('playerMaxLevel', this.game.global.level.current + 1);
        }

        this.soundButton = this.game.add.button(this.game.width - 50, 5, (this.game.sound.mute)?'sound-off':'sound-on', this.toggleSound, this);
        this.soundButton.scale.setTo(0.25);
        this.homeButton = this.game.add.button(5, 5, 'home', this.goHome, this);
        this.homeButton.scale.setTo(0.25);

        this.homeKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
        this.homeKey.onDown.add(this.goHome, this);
        this.soundKey = this.game.input.keyboard.addKey(Phaser.Keyboard.F8);
        this.soundKey.onDown.add(this.toggleSound, this);

        // press any key
        this.game.input.keyboard.callbackContext = this;
        this.game.input.keyboard.onDownCallback = function(e) {
            this.onInputDown(this);
        }
    }

    goHome() {
        //this.music.stop();
        this.game.state.start('menu-level', true, false);
    }

    toggleSound() {
        if (this.game.sound.mute) {
            this.game.sound.mute = false;
            this.soundButton.loadTexture('sound-on');
        } else {
            this.game.sound.mute = true;
            this.soundButton.loadTexture('sound-off');
        }
    }

    update() {}

    onInputDown () {
        if(this.canContinueToNextState){
            this.canContinueToNextState = false;
            if (this.game.global.level.current < this.game.global.level.max) {
                this.game.global.level.current++;
                this.game.state.start('game', true, false);
            } else {
                this.game.state.start('menu-level', true, false);
            }
        }
    }

    computePos(posY, posX) {
        if (posX) {
            return this.game.centerX - 240 + (posX * 120);
        } else {
            return this.game.centerY - 200 + ((posY - 1) * 48);
        }
    }

}

export default Victory;
