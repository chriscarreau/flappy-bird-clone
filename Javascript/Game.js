$(document).ready(function(){

    //ici on crée la game carrément, avec width, height, comment render (?) et le DIV qui le contient
    var game = new Phaser.Game(400, 490, Phaser.CANVAS, 'GameDiv');
    
    //pour changer le sens du jeu
    var sens = 1;
    
    var highScore = 0;
    if (localStorage){
        var temp = localStorage.getItem("HighScore");
        if (temp != null)
                highScore = temp;
    }
    //on crée un état, correspond a un "état" du jeu (menu, jeu, gameover,  etc...)
    var main_state = {
        
        //ça va être exécuté au début, habituellement on load,: image, son, asset
        preload: function(){
            //ÉLÉMENTS DE NIVEAU
            game.stage.backgroundColor= '#23ccde'
            
            //IMAGES
            game.load.image('doge', 'Assets/Doge.png');
            game.load.image('mur', 'Assets/mur.png');
            game.load.image('coin', 'Assets/dogecoin.png');
            game.load.image('switch', 'Assets/switch.png');
        },
        
        //Callé après le preload, on crée la game et display les sprites initial
        create: function(){
            //On cré les objets
            this.doge = game.add.sprite(166, game.height/2, 'doge');
            this.murs = game.add.group();
            this.murs.createMultiple(40, 'mur');
            this.coins = game.add.group();
            this.coins.createMultiple(3, 'coin');
            this.switches = game.add.group();
            this.switches.createMultiple(3, 'switch');
            
            //Physics shenanigan
            game.physics.startSystem(Phaser.Physics.p2);
            game.physics.enable(this.doge);
            this.doge.scale.x = sens;
            this.doge.anchor.setTo(0.5, 0.5);
            //On set les parametre de base/globale de chaque objet
            this.doge.body.gravity.y = 1000;
            
            //timer et score
            game.time.events.start();
            this.timer = this.game.time.events.loop(1500, this.ajouter_colonne_de_mur, this);
            this.score = 0;
            var style = {font: "30px Arial", fill: "#ffffff"};
            this.label_scoreTxt = this.game.add.text(10,20,"Score",style);
            this.label_score = this.game.add.text(40,60,"0",style);
            this.label_HighScoreTxt = this.game.add.text(game.width-80,20,"High",style);
            this.label_HighScore = this.game.add.text(game.width-60,60,highScore,style);
            
            //keypresses
            var space_key = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            var p_key = this.game.input.keyboard.addKey(Phaser.Keyboard.P);
            var q_key = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
            space_key.onDown.add(this.jump, this);
            p_key.onDown.add(function(){game.paused = !game.paused},this);
            q_key.onDown.add(this.change_sens,this);
            this.game.input.onDown.add(this.jump, this);
        },
        
        //ici on update 60 fois par seconde
        update: function(){
            if (this.doge.inWorld == false){
                this.restart_game();
            }
            this.game.physics.arcade.overlap(this.doge, this.murs, this.gameOver, null, this);
            this.game.physics.arcade.overlap(this.doge, this.coins, this.coin_collision, null, this);
            this.game.physics.arcade.overlap(this.doge, this.switches, this.switch_collision, null, this);
            
            this.killGroupItemOutOFBound(this.murs);
            this.killGroupItemOutOFBound(this.coins);
            this.killGroupItemOutOFBound(this.switches);
            
            if (this.doge.angle < 20 || this.doge.angle > -20)  
                this.doge.angle += 1 * sens;
            
        },
        render:function(){
            this.game.debug.body(this.doge);
        },
        
        jump: function(){
            if (this.doge.alive == false)  
                return;
            this.doge.body.velocity.y = -400;
            this.game.add.tween(this.doge).to({angle: -20*sens}, 100).start();
        },
        
        
        restart_game: function(){
            this.game.state.start('main');
        },
        
        ajouter_mur: function(x, y){
            //on va chercher un mur mort... (inutilisé)
            var mur = this.murs.getFirstDead();
            game.physics.enable(mur);
            
            //on set sa position
            mur.reset(x, y);
            
            //on ajoute sa vélocité (direction);
            mur.body.velocity.x = -200 * sens;
            
            
        },
        
        ajouter_colonne_de_mur: function(){
            var trou = Math.floor(Math.random() * 10)+1;
            var hauteurObj = Math.floor(Math.random() * 17)+1;
            
            for(var i=0; i< 18; i++)
            {
                if(i <= trou || i >= trou +5)
                {
                    this.ajouter_mur((sens == 1) ? 400 : -100,i*31);
                }
            }
            
            if((Math.random() * 100)+1 > 75){
                this.ajouterSwitch((sens == 1) ? 500 : -200, hauteurObj*31);
            }
            else{
                this.ajouterCoin((sens == 1) ? 500 : -200, hauteurObj*31);
            }
            this.score +=1;
            this.label_score.text = this.score;
        },
        
        ajouterCoin: function(x,y){
            var coin = this.coins.getFirstDead();
            game.physics.enable(coin);
            coin.reset(x,y);
            coin.body.velocity.x = -200*sens;
            
        },
        
        ajouterSwitch: function(x,y){
            var objswitch = this.switches.getFirstDead();
            game.physics.enable(objswitch);
            objswitch.reset(x,y);
            objswitch.body.velocity.x = -200*sens;
            
        },
        
        coin_collision: function(a, b){
            this.score +=10;
            this.label_score.text = this.score;
            b.kill();
        },
            
        switch_collision: function(a, b){
            b.destroy();
            this.change_sens();
        },
        
        change_sens: function(){
            sens = -sens;
            this.doge.scale.x = sens;
            this.switchGroupItem(this.murs);
            this.switchGroupItem(this.coins);
            this.switchGroupItem(this.switches);
        },
        
        switchGroupItem: function(group){
            for(var i=0; i< group.children.length; i++)
            {
                if(group.children[i].alive)
                {
                    group.children[i].body.velocity.x = -group.children[i].body.velocity.x;                     
                }
            }
        },
        
        killGroupItemOutOFBound: function(group){
            for(var i=0; i< group.children.length; i++)
            {
                if(group.children[i].alive)
                {
                    if (sens == 1){
                        if(group.children[i].position.x < -31)
                        {
                            group.children[i].kill();
                        }
                    }
                    else{
                        if(group.children[i].position.x > 400)
                        {
                            group.children[i].kill();
                        }
                    }
                    
                }
            }
        },
        
        gameOver: function(){
            if(this.doge.alive == false)
                return;
            this.doge.alive = false;
            game.time.events.remove(this.timer);
            this.murs.forEachAlive(function( mur ){mur.body.velocity.x = 0;},this);
            this.coins.forEachAlive(function( coin ){coin.body.velocity.x = 0;},this);
            this.switches.forEachAlive(function( objSwitch ){objSwitch.body.velocity.x = 0;},this);
            if(this.score > highScore)
                highScore = this.score;
            if (localStorage){
                localStorage.setItem("HighScore", highScore);
            }
            this.label_HighScore.text = highScore;
        }
    }
    
    //on ajoute l'état au jeu
    game.state.add('main', main_state);
    
    //on la start
    game.state.start('main');
});