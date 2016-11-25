class Victory extends Phaser.State {

    constructor() {
        super();
    }

    create() {
        var self = this;
        //add background image
        this.background = this.game.add.sprite(0,0,'background');
        this.background.height = this.game.world.height;
        this.background.width = this.game.world.width;
        this.background.alpha = 0.25;

        // Ajout du score
        if (this.game.global.level.current == this.game.global.level.max) {
            this.vitoryText = this.createFont('GAME FINISHED');
        } else {
            this.vitoryText = this.createFont('VICTORY');
        }

        var img = this.game.add.image(this.game.world.centerX, this.computePos(1), this.vitoryText);
        img.anchor.set(0.5);

        // Ajout temps écoulé
        var style = { font: "bold 18px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
        var text = self.game.add.text(self.game.world.centerX, this.computePos(2), this.game.global.level.elapsedTime + ' seconde' + ((this.game.global.elapsedTime>1)?'s':''), style);
        text.anchor.set(0.5);

        // ajout des vies restantes
        for (var i=0; i<this.game.global.player.life; i++) {
            var sprite = this.game.add.sprite(this.game.world.centerX - 30 + 30 * i, this.computePos(3), 'heartFull');
            sprite.scale.setTo(0.5);
            sprite.anchor.setTo(0.5);
        }
        for (;i<this.game.global.player.maxlife;i++) {
            sprite = this.game.add.sprite(this.game.world.centerX - 30 + 30 * i, this.computePos(3), 'heartEmpty');
            sprite.scale.setTo(0.5);
            sprite.anchor.setTo(0.5);
        }

        // Ajout résumé des bonus
        var curPos = 4; i=1;
        this.game.global.player.collected.forEach(function(bonus) {
            sprite = self.game.add.sprite(self.computePos(curPos, i) - 24, self.computePos(curPos), bonus.sprite, bonus.frame);
            if (bonus.scale) {
                sprite.scale.setTo(bonus.scale*0.7);
            } else {
                sprite.scale.setTo(0.7);
            }
            sprite.anchor.setTo(0.5);
            self.game.add.text(self.computePos(curPos, i) + 24, self.computePos(curPos), bonus.count, style).anchor.set(0.5);
            if (i%3 == 0) {
                curPos++;
                i = 1;
            } else {
                i++;
            }
        });

        // Ajout du bonus de temps
        this.game.global.score += Math.floor(1500 / (this.game.global.elapsedTime<1)?1500:this.game.global.elapse.elapsedTime);
        // Ajout du bonus de vie
        this.game.global.score += 50 * this.game.global.player.life;

        // Ajout du score
        this.score = this.createFont('SCORE '+ this.game.global.score);
        img = this.game.add.image(this.game.world.centerX,this.game.world.centerY+200, this.score);
        img.anchor.set(0.5);

        this.game.add.audio('winnerSound').play();

        var sprite = self.game.add.sprite(self.game.world.centerX, self.game.world.centerY + 50, this.game.global.player.sprite, 'idle/01');
        sprite.anchor.set(0.5);
        sprite.animations.add('jump', Phaser.Animation.generateFrameNames('jump/', 1, 10, '', 2), 10, true, false);
        sprite.animations.play('jump');
        this.game.camera.follow(sprite);

        //prevent accidental click-thru by not allowing state transition for a short time
        this.canContinueToNextState = false;
        this.game.time.events.add(Phaser.Timer.SECOND*0.25, function(){ this.canContinueToNextState = true; }, this);

        this.saveScore();

        // press any key
        this.game.input.keyboard.onDownCallback = function(e) {
            self.onInputDown(self);
        }
    }

    saveScore(){
        if (this.game.global.level.current == this.game.global.level.max) {
            $.ajax({
                url: this.game.global.server.url + '/score',
                type: 'PUT',
                dataType: 'json',
                data: JSON.stringify({
                    name: this.game.global.player.name,
                    player: this.game.global.player.sprite,
                    score: this.game.global.score
                }),
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    console.log('Score saved !');
                },
                failure: function(err) {
                    console.log('Erreur de sauvegarde du score !');
                }
            });
        } else {
            this.game.global.scoreLastLevel = this.game.global.score;
        }
    }

    update() {}

    createFont(text) {
        var font = this.game.add.retroFont('fonts', 16, 16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ -0123456789', 20);
        font.text = text;
        return font;
    }

    onInputDown () {
        if(this.canContinueToNextState){
            this.canContinueToNextState = false;
            if (this.game.global.level.current < this.game.global.level.max) {
                this.game.global.level.current++;
                this.game.state.start('game', true, false);
            } else {
                this.game.state.start('menu', true, false);
            }
        }
    }

    computePos(posY, posX) {
        if (posX) {
            return this.game.world.centerX - 240 + (posX * 120);
        } else {
            return this.game.world.centerY - 350 + ((posY - 1) * 48);
        }
    }



}

export default Victory;
