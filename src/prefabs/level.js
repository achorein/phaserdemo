import Player from '../prefabs/player';

class Level extends Phaser.Tilemap {

  //initialization code in the constructor
  constructor(state, key, tileWidth, tileHeight, width, height) {
    super(state.game, key, tileWidth, tileHeight, width, height);
    var self = this;

    this.addTilesetImage('world-spritesheet', 'world');
    // réupération des layers pour la construction du monde
    this.backLayer = this.createLayer('back');
    this.backLayer.resizeWorld();
    this.blocsLayer = this.createLayer('blocs');
    this.blocsLayer.resizeWorld();

    // gestion des collisions sur tile
    this.setLayer(this.blocsLayer);
    this.setCollisionBetween(1, 680);

    // Gestion des collisions avec le décors (ajout des callback)
    // gestion des jumper
    this.jumperSprites = [573, 574];
    this.setTileIndexCallback(this.jumperSprites[0],
        this.jumperCallback, this, this.backLayer);
    // Gestion des pics et de l'eau
    this.setTileIndexCallback([571, 572, 81, 82, 83, 84, 85, 86, 170, 171, 176,177],
        state.killPlayerCallback, state, this.backLayer);
    // Gestion des echelles
    this.setTileIndexCallback([79, 80, 93, 94, 95, 540],
        this.echelleCallback, this, this.backLayer);

    // Ajoute des zonnes de collision spécifiques
    this.addCollisionObjects(self);
    // Ajout des blocs mobiles
    this.addLevelSpecialBlocs(self);

    // Ajou des pièges/lasers
    this.addLevelTraps(self);
    // Ajout des bonus
    this.addLevelBonus(self);
    // Ajout des enemies
    this.addLevelEnemies(self);

    // Ajout du joueur
    var gameLayer = this.layers[this.getLayer('game')];
    gameLayer.data.forEach(function(row) {
      row.forEach(function(data){
          if (data.index > 0 && data.properties.start) {
              state.player = new Player(self.game, data.x*data.width, data.y*data.height);
              self.game.add.existing(state.player);
          }
      });
    });

    // Ajout du layer front en dernier pour être au premier plan
    this.frontLayer = this.createLayer('front');
    this.frontLayer.resizeWorld();
  }

    /**
     *
     * @param state l'était courant du jeu
     * @returns {boolean} vrai si joueur sur une echelle
     */
  update(state) {
    // gestion des collisions (type terrain)
    this.game.physics.arcade.collide(state.player, this.blocsLayer);
    // type decors (nécessaire pour les callback sur tile)
    this.game.physics.arcade.collide(state.player, this.backLayer);
    // hack pour gérer les pentes
    this.game.physics.arcade.collide(state.player, this.stairGroup, function(player, stair) {
      if (player.body.touching.left || player.body.touching.right) {
          player.y -= 1;
          player.body.velocity.x += 10;
      }
    });
    // blocs mobiles
    this.game.physics.arcade.collide(this.specialBlocsGroup, this.blocsLayer, this.specialBlocsCollisionCallBack);
    this.game.physics.arcade.collide(this.specialBlocsGroup, this.gameCollisionGroup, this.specialBlocsCollisionCallBack);
    this.game.physics.arcade.collide(state.player, this.specialBlocsGroup, this.specialBlocCallback, null, this);

    // gestion des collisions sur objets donnant la mort
    this.game.physics.arcade.collide(state.player, this.deathGroup, state.killPlayerCallback, null, state);

    // type bonus, quand le joueur touche une étoile
    this.game.physics.arcade.overlap(state.player, this.bonusGroup, state.collectBonus, null, state);

    // Gestion des pièges
    this.traps.forEach(function(trap){
        state.physics.arcade.collide(trap.bullets, state.map.blocsLayer, function(bullet){ bullet.kill();});
        state.physics.arcade.collide(trap.bullets, state.map.collisionGroup, function(bullet) { bullet.kill(); });
        state.physics.arcade.overlap(trap.bullets, state.player, state.killPlayerCallback, null, state);
    });

    // gestion des collisions des ennemies (terrain)
    this.game.physics.arcade.collide(this.enemiesGroup, this.blocsLayer, this.enemyCollisionCallBack);
    // gestion des collisions des ennemies (barriere virtuelle)
    this.game.physics.arcade.collide(this.enemiesGroup, this.gameCollisionGroup, this.enemyCollisionCallBack);
    // quand le joueur touche un enemie
    this.game.physics.arcade.overlap(state.player, this.enemiesGroup, function(player, enemy) {
      if (enemy.alive) {
          state.killPlayerCallback(player, enemy);
      }
    }, null, state);
  }

  jumperCallback(sprite, tile) {
    var self = this;
    sprite.body.velocity.y = -this.game.global.maxVelocity;
    this.game.add.audio('jumpSound').play('', 0, 0.25);
    // on met une image de jumper activé
    this.replace(tile.index, this.jumperSprites[1], tile.x, tile.y, 1, 1, this.backLayer);
    this.game.time.events.add(Phaser.Timer.SECOND * 0.25, function() {
        // on remet une image de jumper désactivé
        self.replace(self.jumperSprites[1], self.jumperSprites[0], tile.x, tile.y, 1, 1, self.backLayer);
    });
  }

  echelleCallback(player, tile) {
      // quand le joueur touche un sprite d'echelle, incrémente un compteur
      this.game.global.timer.echelle++;
      this.game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
          // décrémente le compteur pour pouvoir déterminer si on est sortie de l'echelle
          this.game.global.timer.echelle--;
          if (this.game.global.timer.echelle <= 0) {
              // sortie de l'echelle, restauration de la gravité
              player.body.gravity.set(0);
          }
      }, this);
  }

    specialBlocCallback(player) {
        // quand le joueur est sur un bloc, incrémente un compteur
        if (player.body.touching.down) {
            this.game.global.timer.bloc++;
            this.game.time.events.add(Phaser.Timer.SECOND * 0.1, function () {
                // décrémente le compteur pour pouvoir déterminer si on est sortie du bloc
                this.game.global.timer.bloc--;
            }, this);
        }
    }

    specialBlocsCollisionCallBack(special, bloc) {
        if (special.body.touching.left || special.body.touching.right) {
            special.body.velocity.x *= -1;
        } else if (special.body.touching.up || special.body.touching.down) {
            special.body.velocity.y *= -1;
        }
    }

    enemyCollisionCallBack(enemy, bloc) {
      if (enemy.body.touching.left || enemy.body.touching.right) {
          enemy.scale.x *= -1; // symetrie verticale
          enemy.body.velocity.x *= -1;
      }
    }

    /**
     *
     * @param sprite nom du sprite
     * @param frame index de la frame du spritesheet
     * @param points nombre de points affecté au bonus (si value créé l'objet dans l'inventaire)
     * @returns {*}
     */
    getCollectedObject(sprite, frame, points) {
      for (var i=0; i<this.game.global.collected.length; i++){
          if (this.game.global.collected[i].sprite == sprite && this.game.global.collected[i].frame == frame) {
              if (points) {
                  this.game.global.collected[i].count = 0;
              }
              return this.game.global.collected[i];
          }
      }
      if (points) {
          // création d'un nouveau type d'objet à collecter
          var object = {
              sprite: sprite,
              frame: frame,
              points: points,
              count: 0
          };
          this.game.global.collected.push(object);
          return object;
      }
      return null;
    }

    /**
     * à la main (car fonction this.createFromObjects impossible sans gid non généré par Tiled)
     * @param self
     */
    addCollisionObjects(self) {
        // gestion des pentes
        this.stairGroup = this.game.add.group();
        this.stairGroup.enableBody = true;
        if (this.objects.stairCollision) {
            this.objects.stairCollision.forEach(function (object) {
                var sprite = self.game.add.sprite(object.x, object.y);
                self.game.physics.arcade.enableBody(sprite);
                sprite.body.moves = false;
                sprite.body.setSize(object.width, object.height);
                self.stairGroup.add(sprite);
            });
        }

        // gestion des collisions sur les objets plus petit qu'un sprite
        this.collisionGroup = this.game.add.group();
        this.collisionGroup.enableBody = true;
        if (this.objects.playerCollision) {
            this.objects.playerCollision.forEach(function (object) {
                var sprite = self.game.add.sprite(object.x, object.y);
                self.game.physics.arcade.enableBody(sprite);
                sprite.body.moves = false;
                sprite.body.setSize(object.width, object.height);
                self.collisionGroup.add(sprite);
            });
        }

        // gestion des collisions sur les objets plus petit qu'un sprite
        this.deathGroup = this.game.add.group();
        this.deathGroup.enableBody = true
        if (this.objects.deathCollision) {
            this.objects.deathCollision.forEach(function (object) {
                var sprite = self.game.add.sprite(object.x, object.y);
                self.game.physics.arcade.enableBody(sprite);
                sprite.body.moves = false;
                sprite.body.setSize(object.width, object.height);
                self.deathGroup.add(sprite);
            });
        }

        // gestion des collisions sur les enemies (limitation des mouvements)
        this.gameCollisionGroup = this.game.add.group();
        this.gameCollisionGroup.enableBody = true;
        if (this.objects.gameCollision) {
            this.objects.gameCollision.forEach(function (object) {
                var sprite = self.game.add.sprite(object.x, object.y);
                self.game.physics.arcade.enableBody(sprite);
                sprite.body.moves = false;
                sprite.body.setSize(object.width, object.height);
                self.gameCollisionGroup.add(sprite);
            });
        }
    }

    addLevelSpecialBlocs(self) {
        // gestion des blocs qui bouges
        this.specialBlocsGroup = this.game.add.group();
        this.specialBlocsGroup.enableBody = true;
        var collectableLayer = this.layers[this.getLayer('game')];
        collectableLayer.data.forEach(function (row) {
            row.forEach(function (tile) {
                if (tile.index > 0 && tile.properties.moves) {
                    var bloc = self.game.add.sprite(tile.x * tile.width, tile.y * tile.height, "world", tile.index - 1);
                    self.game.physics.arcade.enableBody(bloc);
                    if (tile.properties.x) bloc.body.velocity.x = parseInt(tile.properties.x);
                    if (tile.properties.y) bloc.body.velocity.y = parseInt(tile.properties.y);
                    bloc.body.maxVelocity.set(self.game.global.maxVelocity);

                    if (!tile.properties.pushable) {
                        bloc.body.gravity.set(0, -self.game.global.gravity);
                        bloc.body.immovable = true;
                    } else {
                        bloc.body.bounce.set(0.5);
                        //bloc.body.friction.set(1000);
                    }
                    bloc.body.collideWorldBounds = true;
                    self.specialBlocsGroup.add(bloc);
                }
            });
        });
    }

    /**
     *
     * @param self
     */
    addLevelEnemies(self) {
        this.enemiesGroup = this.game.add.group();
        this.enemiesGroup.enableBody = true;
        var enemiesLayer = this.layers[this.getLayer('game')];
        if (enemiesLayer) { // si il y a un layer enemies
            enemiesLayer.data.forEach(function (row) {
                row.forEach(function (tile) {
                    if (tile.index > 0 && tile.properties.enemy) {
                        var sprite = 'spider';
                        if (tile.properties.sprite) {
                            sprite = tile.properties.sprite;
                        }
                        var offset = 16;
                        if (tile.properties.offset) {
                            offset = tile.properties.offset;
                        }
                        var enemy = self.enemiesGroup.create(tile.x * tile.width + offset, tile.y * tile.height + offset, sprite, 1);
                        if (tile.properties.atlas) {
                            enemy.animations.add('dead', Phaser.Animation.generateFrameNames('dead/', 1, 8, '', 2), 6, false, false);
                            enemy.animations.add('walk', Phaser.Animation.generateFrameNames('walk/', 1, 10, '', 2), 10, true, false);
                            enemy.animations.play('walk');
                        } else {
                            enemy.animations.add('walk', [1, 2], 2, true);
                            enemy.animations.add('dead', [0], 2, false);
                            enemy.animations.play('walk');
                        }
                        enemy.anchor.setTo(.5, 0);
                        if (tile.properties.scale){
                            enemy.scale.setTo(tile.properties.scale);
                        }
                        if (tile.properties.velocity) {
                            enemy.body.velocity.x = tile.properties.velocity;
                        } else {
                            enemy.body.velocity.x = -75;
                        }
                        if (tile.properties.mirormiror) {
                            enemy.scale.x *= -1; // symetrie verticale
                        }
                        enemy.body.maxVelocity.set(self.game.global.maxVelocity);
                        enemy.body.gravity.set(0, -self.game.global.gravity);
                        enemy.body.collideWorldBounds = true;
                        self.getCollectedObject(sprite, 0, 25); // le créé si existe pas
                    }
                });
            });
    }

}
    /**
     *
     * @param self
     */
    addLevelTraps(self) {
        this.traps = [];
        var trapLayer = this.layers[this.getLayer('blocs')];
        trapLayer.data.forEach(function (row) {
            row.forEach(function (tile) {
                if (tile.properties.bulletSpeed) {
                    var sprite = 'bullet-fire';
                    if (tile.properties.sprite){
                        sprite = tile.properties.sprite;
                    }
                    var trap = self.game.add.weapon(30, sprite);
                    var offset = 32;
                    trap.x = tile.x * tile.width + offset;
                    trap.y = tile.y * tile.height + offset;
                    trap.autofire = true
                    trap.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS
                    trap.bulletSpeed = tile.properties.bulletSpeed;
                    trap.fireRate = tile.properties.fireRate;
                    var gravity = -self.game.global.gravity;
                    if (tile.properties.gravity) {
                        gravity += tile.properties.gravity;
                    }
                    trap.bulletGravity.set(0, gravity);
                    if (tile.properties.fireAngle == 'left') {
                        trap.fireAngle = Phaser.ANGLE_LEFT;
                        trap.x -= 32;
                    } else if (tile.properties.fireAngle == 'up') {
                        trap.fireAngle = Phaser.ANGLE_UP;
                        trap.y -= 32;
                    } else if (tile.properties.fireAngle == 'down') {
                        trap.fireAngle = Phaser.ANGLE_DOWN;
                        trap.y += 32;
                    } else {
                        trap.fireAngle = Phaser.ANGLE_RIGHT;
                        trap.x += 32;
                    }
                    if (tile.properties.angularVelocity) {
                        trap.onFire.add(function (bullet, weapon) {
                            bullet.body.angularVelocity = tile.properties.angularVelocity;
                        });
                    }
                    self.traps.push(trap);
                }
            });
        });
    }

    /**
     *
     * @param self
     */
    addLevelBonus(self) {
        this.bonusGroup = this.game.add.group();
        this.bonusGroup.enableBody = true;
        var collectableLayer = this.layers[this.getLayer('game')];
        collectableLayer.data.forEach(function (row) {
            row.forEach(function (tile) {
                if (tile.index > 0 && tile.properties.points) {
                    var bonus = self.game.add.sprite(tile.x * tile.width, tile.y * tile.height, "world", tile.index - 1);
                    self.game.physics.arcade.enableBody(bonus);
                    bonus.points = parseInt(tile.properties.points);
                    bonus.body.moves = false; // ne subit pas la gravité
                    self.bonusGroup.add(bonus);
                    self.getCollectedObject('world', tile.index - 1, bonus.points); // le créé si existe pas
                }
            });
        });
    }

}

export default Level;
