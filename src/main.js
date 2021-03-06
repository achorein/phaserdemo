import Boot from './states/boot';
import Game from './states/game';
import MenuHome from './states/menu-home';
import MenuLevel from './states/menu-level';
import MenuLeaderBoard from './states/menu-leaderboard';
import Preloader from './states/preloader';
import Gameover from './states/gameover';
import Victory from './states/victory';

var conf = {
    width: 1024,
    height: 768,
    renderer: Phaser.CANVAS,
    parent: 'phaser-game',
    transparent: false,
    antialias: false,
    state: this,
    scaleMode: Phaser.ScaleManager.RESIZE
};

const game = new Phaser.Game(conf);
game.state.add('boot', new Boot());
game.state.add('game', new Game());
game.state.add('menu', new MenuHome());
game.state.add('menu-level', new MenuLevel());
game.state.add('menu-leaderboard', new MenuLeaderBoard());
game.state.add('preloader', new Preloader());
game.state.add('gameover', new Gameover());
game.state.add('victory', new Victory());

game.state.start('boot');
