// Arctic.lib  test  

// Load up the discord.js library
const Discord = require("discord.js");

// controls what messages show in the console.log
const debug = false;

// These 3 are part of my repairs to LoreBot
// although Moment is nice.
require("babel-polyfill");
const querystring = require('querystring'); //for parsing commands specified in !query
var moment = require('moment');
const MAX_ITEMS = 3;
const BRIEF_LIMIT = 50;
const MYSQL_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss"; // for use with moment().format(MYSQL_DATETIME_FORMAT)


// https://leovoel.github.io/embed-visualizer/   - creating rich embed messages


// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.
// config.authorized contains an array of authorized users for reserved commands
//const lorebotconfig = require("./lorebotconfig.json");

var mysql = require('mysql');
const { Console } = require("console");

var pool = mysql.createPool({
  connectionLimit: 100,
  host:'69.146.195.176',
  port:'777',
  user: config.username,
  password: config.password,
  database: config.database,
  debug: false
});

//var lorebotpool = mysql.createPool({
//	connectionLimit: 100,
//	host:'localhost',
//	user: config.username,
//	password: config.password,
//	database: lorebotconfig.database,
//	debug: false
//});

// This is how long lines are currently (non-mobile)
// this is used in creating space or when to add \n
var LineLength = 52;

// Attempting to get past the single thread limitations of Javascript

// This is for shortname/longname of zones
// *****
//    BOT NEEDS TO BE RESTARTED FOR THIS ARRAY TO UPDATE (needs fixed)
// *****
var ShortLongZones = new Array();
pool.getConnection((err,connection)=>{
	if (err) {
		connection.release();
		console.log({"code":100,"status":"Error in db connection in pool.getConnect(L.35)"});
	} else {
		sqlStr = "SELECT shortname,longname FROM zones ORDER BY shortname ASC";
		console.log("[INIT]Attemping to build Short/Long Array");
		connection.query(sqlStr,(err,rows) => {
			connection.release();
			if (!err) {
				for (let i=0;i<rows.length;i++) {
					ShortLongZones.push([rows[i].shortname,rows[i].longname]);
				}
				console.log("[INIT]Short/Long Array built");
			}
		});
	}
});

var ClassArray = ["cleric", "druid", "shaman"];
if (ClassArray.length > 0) {console.log("[INIT]ClassArray array created");}

// used in the +zones command
var AvailableAreas = [];
sqlStr = "SELECT * FROM zones";
try {
	runQuery(sqlStr, function(rows) {
		//console.log(rows.length);
		for (let i=0;i<rows.length;i++) {
			if (rows[i].arealocatedin != null) {
				if (rows[i].arealocatedin != '') {
					let hascomma = false;
					let alreadyadded = AvailableAreas.includes(rows[i].arealocatedin);
					if (rows[i].arealocatedin.indexOf(',') !== -1) {hascomma = true;}
					if (!alreadyadded && !hascomma) {
						AvailableAreas.push(rows[i].arealocatedin);
						//console.log("Added "+rows[i].arealocatedin+" | "+AvailableAreas.length);
					}
				}
			}
		}
	});
}
catch(err) {console.log("[sMD]Error Caught: "+err);}

var Emojis = [
	[".+\\sdragon$"," dragon"," :dragon:"],
	[".+\\sdragon\\s.+"," dragon "," :dragon: "]
]
if (Emojis.length > 0) {console.log("[INIT]Emojis array created");}

var ListOptions = ["learn", "alchemists", "dragons", "hitroll"];
if (ListOptions.length > 0) {console.log("[INIT]ListOptions array created");}

var ValidCommands = ["spells","spell","sp","ping","rm","sendlog","tsf","zoneinfo","zonei","zi","zones","zone","locate","loc","dirs","help","say","test","update","up","stats","list","li","rz","randomzone","idea","legend","prep","mi","mobinfo"];

var Classes = ["cleric","druid","shaman","red robe","white robe","black robe","scout","paladin","warrior","dark knight","thief","barbarian"];
if (Classes.length > 0) {console.log("[INIT]Classes array created");}

var Dragons = [
	["khita","blue","shad"],
	["ancient red dragon","red","ancred"],
	["zmij","white","pyr"],
	["cinder","black","bda"],
	["cyan","green","silvi"],
	["charr","black","draco"]
];
if (Dragons.length > 0) {console.log("[INIT]Dragons array created");}

var LearnDrops = [
	["a robe covered in eyes","10","about","boyl"],
	["a black cowl","15","head","dract"],
	["a symbol of an open book","3","neck","haven"],
	["a fairy skull ring","2","finger","unknown"],
	["a ragged leather cassock","5","neck","aghar"],
	["a thin monocle","3","head","kruin"],
	["a finely etched brass telescope","5","held","caer"]
];
if (LearnDrops.length > 0) {console.log("[INIT]LearnDrops array created");}

var HitrollDrops = [
	["a fine looking gold ring","finger","unknown"],
	["a ragged leather mantle","neck","aghar"],
	["a ragged leather caul","head","aghar"],
	["a gold rounded pin","neck","bully"],
	["a suit of padded red leather armor","body","unknown"],
	["a pair of foreman's mining gloves","hands","unknown"],
	["a ragged pair of leather arm bands","arms","aghar"],
	["a bracelet of the white owl","wrist","unknown"],
	["a copper dwarven bracelet","wrist","thorb"]
];
if (HitrollDrops.length > 0) {console.log("[INIT]HitrollDrops array created");}

var Last5Users = [];
console.log("[INIT]Last5Users array created");

var AuthorizedUsers = config.authorized;
if (AuthorizedUsers.length > 0) {console.log("[INIT]AuthorizedUsers established");}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
function pickRandomzone(tier,args,message,command,fn) {
	sqlStr = "SELECT longname FROM zones WHERE tier = '"+tier+"'";
	try {
		runQuery(sqlStr, function(rows) {
			let TempZoneArray = [];
			for (let i=0;i<rows.length;i++) {TempZoneArray.push(rows[i].longname);}
			let randzone = TempZoneArray[Math.floor(Math.random() * TempZoneArray.length)];
			fn(randzone);
		},args,message,command);
	} 
	catch(err) {
		console.log("[pR]Error Caught: "+err);
	}
}
function ConvertYesNo(answer){
	if (answer == 0) {return "NO";}
	if (answer == 1) {return "YES";}
	return "N/A";
}
function ProcessMobInfo(row,message) {
	if (row.length == 1) {
		let od = "";
		let canbe = "`";
		let casts = "`";
		let immune = "`";
		od += "Mob: `"+row[0].name+"`\n";
		// Determine what the mob can be affected by
		if (row[0].para) {canbe += " paralyzed";}
		if (row[0].blind) {canbe += " blinded";}
		if (row[0].entangle) {canbe += " entangled";}
		if (row[0].stabbed) {canbe += " backstabbed";}
		if (row[0].silence) {canbe += " silenced";}
		if (row[0].held) {canbe += " held";}
		if (row[0].bashland > 0) {canbe += " bashed";}
		// Determine what the mob casts
		if (row[0].prism) {casts += " prism";}
		if (row[0].nightmare) {casts += " nightmare";}
		if (row[0].stun) {casts += " stun";}
		if (row[0].tent) {casts += " tent";}
		if (row[0].blastwave) {casts += " blastwave";}
		if (row[0].sunray) {casts += " sunray";}
		if (row[0].heal) {casts += " heal";}
		if (row[0].litstorm) {casts += " lightning_storm";}
		if (row[0].holyword) {casts += " holy_word";}
		// Determine what the mob is immune to
		if (row[0].immheat) {immune += " heat";}
		if (row[0].immcold) {immune += " cold";}
		if (row[0].immmagic) {immune += " magic";}
		if (row[0].immelec) {immune += " elec";}
		if (row[0].immneg) {immune += " neg";}
		if (row[0].immacid) {immune += " acid";}
		if (row[0].immgas) {immune += " gas";}
		if (row[0].immholyword) {immune += " holyword";}
		canbe += "`";
		casts += "`";
		immune += "`";
		if (canbe != "``") {od += "Can be: "+canbe+"\n";}
		if (casts != "``") {od += "Casts: "+casts+"\n";}
		if (immune != "``") {od += "Immune to: "+immune+"\n";}
		if (row[0].reflect) {od += "This mob is `REFLECT`.\n";}
		if (row[0].target) {od += "This mob will `TARGET`.\n";}
		if (row[0].rank) {od += "This mob gives `RANK` xp.\n";}
		var lastUpdate = new Date(row[0].lastupdated).toISOString().slice(0,10);
		od += "Last Updated: " + lastUpdate + "\n";
		message.author.send(od);
		console.log("[PMI]Message Sent!");
	} else {console.log("[PMI] BAD ROW COUNT ");}
}
function showZoneTierInfo() {
	x = '';
	x += "**Tier Info**\n";
	x += "```";
	x += "Tier 0: ";
	x += "places not intended to take a group to zone\n";
	x += "Tier 1: ";
	x += "lower level groups/solo pre-legend (1-20)\n";
	x += "Tier 2: ";
	x += "mid level groups/solo pre-legend (20-25)\n";
	x += "Tier 3: ";
	x += "mid/high level groups/solo+ legend (25-28)\n";
	x += "Tier 4: ";
	x += "mid/high level groups/duo+ legend (28-30)\n";
	x += "Tier 5: ";
	x += "high level groups w/legends (30)\n";
	x += "```";
	
	return x;
}
function checkAdminRights(message) {
	let auth = false;
	for (let i=0;i<AuthorizedUsers.length;i++) {
		if (AuthorizedUsers[i].username.toString() == message.author.username.toString()) {auth = true;}
	}
	if (auth) {if (debug) {console.log("[cAR] User "+message.author.username+" authorized!");}}
	else {if (debug) {console.log("[cAR] User "+message.author.username+" NOT authorized!");}}
	return auth;
}
function showInvalidCommandMessage(message,args,command) {
	let z = '';
	if (args.length > 0) {z = args.join(" ");}
	let msg = 	"Unknown Command:`+"+command+"`.\n";
	if (args.length > 0) {msg +=		"Your arguments: `"+z+"` were ignored.\n";}
	msg +=		"`+help` for a list of available commands.";
	message.author.send(msg);
}
function returnTimeStamp() {
	var TimeArray = [];
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	var yy = parseInt(yyyy.toString().substring(2));
	var hh = today.getHours();
	var mmm = today.getMinutes();
	if (dd < 10) { dd = '0'+dd; }
	if (mm == '') {mm = '00';}
	else if (mm < 10 && mm != '') { mm = '0'+mm; }

	var Last5Time = mm+"/"+dd+"/"+yy+" "+hh+":"+mmm;
	TimeArray[0] = Last5Time;
	return TimeArray;
}
function showLast5(message,args,command) {
	let x = '**Last 5 people who accessed me:**\n';
	for (let i=0;i<Last5Users.length;i++) {
		x += "\t"+Last5Users[i]+"\n";
	}
	message.author.send(x);
}
function showMissingDirs(message,args,command,fn) {
	sqlStr = "SELECT * FROM directions";
	let ZonesWithDirs = [];
	let ZonesMissingDirs = [];
	try {
		runQuery(sqlStr, function(rows) {
			for (let i=0;i<rows.length;i++) {
				let shortname1 = rows[i].startlocation;
				let shortname2 = rows[i].endlocation;
				if (ZonesWithDirs.indexOf(shortname1) == -1) {ZonesWithDirs.push(shortname1);}
				if (ZonesWithDirs.indexOf(shortname2) == -1) {ZonesWithDirs.push(shortname2);}
			}
			ShortLongZones.forEach((data,index) => {
				let datashortname = data[0];
				if (ZonesWithDirs.indexOf(datashortname) == -1) {ZonesMissingDirs.push(datashortname);}
			});
			let zwdcount = ZonesWithDirs.length;
			let zmdcount = ZonesMissingDirs.length;
			let x = [];
			x[0] = ZonesMissingDirs;
			x[1] = zwdcount;
			x[2] = zmdcount;
			fn(x);
		});
	}
	catch(err) {
		console.log("[sMD]Error Caught: "+err);
	}
}
function showList(list) {
	if (list.toLowerCase() == "dragons") {
		let x = '';
		Dragons.forEach((dragon,index) => {
			let name = dragon[0];
			let color = dragon[1];
			let zone = dragon[2];
			try {
				getLongName(zone, function(longname) {
					 x += "**"+ucFirstAllWords(name)+"** the **"+ucFirstAllWords(color)+" Dragon** who resides in **"+ucFirstAllWords(longname)+"**\n";
				});
			}
			catch(err) {
				x += "**"+ucFirstAllWords(name)+"** the **"+ucFirstAllWords(color)+" Dragon** who resides in **<ERROR>**\n";
				console.log("[sL]Error Caught (dragon): "+err);
			}
		});
		return x;
	} else
		
	if (list.toLowerCase() == "learn") {
		let x = '';
		LearnDrops.forEach((learn,index) => {
			let name = learn[0];
			let amount = learn[1];
			let worn = learn[2];
			let zone = learn[3];
			try {
				getLongName(zone, function(longname) {
					x += "**"+name+"** which is `+"+amount+"` learn\n\tequip slot: `"+worn+"` and drops in **"+ucFirstAllWords(longname)+"**\n";
				});
			}
			catch(err) {
				x += "**"+name+"** which is `+"+amount+"` learn\n\tequipslot: `"+worn+"` and drops in **<ERROR>**\n";
				console.log("[sL]Error Caught (learn): "+err);
			}
		});
		return x;
	} else
		
	if (list.toLowerCase() == "alchemists") {
		let x = 'You are looking for a list of `alchemists` locations, but it\'s not ready yet.';
		return x;
	}
	
	if (list.toLowerCase() == "hitroll") {
		let x = '';
		HitrollDrops.forEach((item,index) => {
			let name = item[0];
			let slot = item[1];
			let zone = item[2];
			try {
				getLongName(zone, function(longname) {
					//x += "**SLOT**: `"+slot+"`, `"+name+"` loads in `"+ucFirstAllWords(longname)+"`\n";
					x += "`"+name+"` loads in `"+ucFirstAllWords(longname)+"` and is worn in slot `"+slot.toUpperCase()+"`\n";
				});
			}
			catch(err) {
				x += "**SLOT**: `"+slot+"`, `"+name+"` loads in `ERROR`\n";
				console.log("[sL]Error Caught (hitroll): "+err);
			}
		});
		x += '';
		return x;
	}
}
function testEmbed(message) {
	message.channel.send({embed: {
		color: 3447003,
		author: {
		  name: client.user.username,
		  icon_url: client.user.avatarURL
		},
		title: "Arctic.LIB Requesting Access",
		url: "http://arcticmud.org/",
		description: "Hello Tim!  I am a `BOT` created to house all information for Arctic in a single, accessible location.",
		fields: [{
			name: "Test Me Out",
			value: "**+help** will show you how I work (DM's work)"
		  },
		  {
			name: "Add Arctic.LIB",
			value: "Click here [Add Arctic.LIB](https://discordapp.com/oauth2/authorize?client_id=377843327082561541&scope=bot) to add me to the Myth server."
		  },
		  {
			name: "We can Chat!",
			value: "You can **+message** the creator as well.  They wish to remain anonymous for now."
		  },
		  {
			name: "Special for Tim!",
			value: "This message was sent to you because I believe you have power to add me.  If you do not, please let me know who does!"
		  }
		],
		timestamp: new Date(),
		footer: {
		  icon_url: client.user.avatarURL,
		  text: "© Arctic.LIB 2018"
		}
	}});
}
function showLegendShop(clas) {
	let x = '';
	let y = '';
	let z = '';
	x += '```\n';
	x += '1      Sixth Sense            0/1  2   3000 DETECT_EVIL DETECT_GOOD\n';
	x += '											DETECT_UNDEAD\n';                
	x += '2      Magic Eyes             0/1  1   3000 DETECT_MAGIC INFRAVISION\n';
	x += '											DETECT_POISON\n';
	x += '3      Eye Spy                0/1  2   3000 DETECT_INVISIBLE SENSE_LIFE\n';
	x += '4      Sea & Air              0/1  3   5000 WATERBREATH CAN_FLY\n';
	x += '5      Smooth Criminal        0/1  4   8000 SNEAK HIDE\n';
	x += '6      Soul Armor             0/1  3   7000 NOCHARM IMMUNE_CURSE\n';
	x += '7      Loudmouth              0/1  4  10000 IMMUNE_SILENCE\n';
	x += '8      Crack Vision           0/1  6  25000 TRUE_SEEING IMMUNE_BLINDNESS\n';
	x += '9      Brain Cage             0/1  7  35000 DETECT_SCRY MINDSHIELD\n';
	x += '10     Afterglow              0/1  6  50000 NIGHTVISION\n';
	x += '11     Peripheral Vision      0/1  4  25000 AWARENESS\n';
	x += '12     Uncorruptible          0/1  6  30000 IMMUNE_NEGATIVE_ENERGY\n';
	x += '											IMMUNE_CURSE\n';
	x += '13     Anti-Freeze            0/1 10  60000 IMMUNE_COLD\n';
	x += '14     Fireproof              0/1 10  60000 IMMUNE_HEAT\n';
	x += '15     Shock Trooper          0/1  8  50000 IMMUNE_ELECTRICITY\n';
	x += '16     Antacid                0/1  8  50000 IMMUNE_ACID\n';
	x += '17     Nothing Noxious        0/1  8  80000 IMMUNE_GAS\n';
	x += '18     Weight Lifter          0/4  2   3000 STR by 1\n';
	x += '19     Power Lifter           0/1  4   6000 STR by 2\n';
	x += '20     Nerd                   0/4  2   3000 INT by 1\n';
	x += '21     Super Nerd             0/1  4   6000 INT by 2\n';
	x += '22     Zen                    0/4  2   3000 WIS by 1\n';
	x += '23     Enlightenment          0/1  4   6000 WIS by 2\n';
	x += '24     Nimble                 0/4  2   3000 DEX by 1\n';
	x += '25     Agile                  0/1  4   6000 DEX by 2\n';
	x += '26     Grit                   0/4  2   3000 CON by 1\n';
	x += '27     True Grit              0/1  4   6000 CON by 2\n';
	x += '28     Influencer             0/4  2   3000 CHA by 1\n';
	x += '29     Manipulator            0/1  4   6000 CHA by 2\n';
	x += '30     Jogger                 0/2  1   2000 MOVE by 20\n';
	x += '31     Runner                 0/1  2   4000 MOVE by 40\n';
	x += '32     Rigid Skin             0/2  1   2500 ARMOR by -10\n';
	x += '```';
	y += '```\n';
	y += '33     Thick Skin             0/1  2   5000 ARMOR by -20\n';
	y += '34     Model Student          0/2  3   4000 LEARN by 5\n';
	y += '35     Wap                    0/3  4  13000 DAMROLL by 1\n';
	y += '36     Fwap                   0/1  7  25000 DAMROLL by 2\n';
	y += '37     Whiff                  0/3  2   3000 HITROLL by 1\n';
	y += '38     Whiff Whiff            0/1  4   6000 HITROLL by 2\n';
	y += '39     Accuracy               0/3  2   3000 RANGED_HITROLL by 1\n';
	y += '40     Trueshot               0/1  4   6000 RANGED_HITROLL by 2\n';
	y += '39     Steel Spine            0/3  1   2000 SAVING_PARA by -1\n';
	y += '40     Antidote               0/3  1   2000 SAVING_POISON by -1\n';
	y += '41     Mandrake Root          0/3  1   2000 SAVING_PETRI by -1\n';
	y += '42     Peppermint             0/3  2   3000 SAVING_BREATH by -1\n';
	y += '43     Elude Spell            0/3  2   5000 SAVING_SPELL by -1\n';
	y += '44     Battlecaster           0/4  2   5000 CONCENTRATION_FACTOR by 5\n';
	y += '45     Deft Touch             0/4  2   5000 HEALING_BONUS by 5\n';
	y += '46     Pain Tolerance         0/3  2   5000 RESIST CRITICALS by 1.2%\n';
	y += '47     Arcane Infiltration    0/2  4  20000 SPELL_SAVES_MOD by 1\n';
	y += '48     Mortal Striker         0/3  3   6000 SCORE CRITICALS by 1.2%\n';
	y += '49     Capable Apprentice     0/3  2   6500 spell slots by 1 at level 1\n';   
	y += '											spell slots by 1 at level 2\n'; 
	y += '											spell slots by 1 at level 3\n';
	y += '50     Insightful Understudy  0/2  3   8500 spell slots by 1 at level 4\n';
	y += '											spell slots by 1 at level 5\n';
	y += '51     Prudent Specialist     0/1  4  10000 spell slots by 1 at level 6\n';
	y += '52     Venerable Sage         0/1  4  10000 spell slots by 1 at level 7\n';
	y += '53     Enlightened Expert     0/1  4  12000 spell slots by 1 at level 8\n';
	y += '54     Forceful Guru          0/1 10  40000 spell slots by +1 for all\n';
	y += '											spell levels\n';
	y += '55     Inferno                0/1 30 1000000 FIRESHIELD\n';
	y += '56     Ice Queen              0/1 30 1000000 ICESHIELD\n';
	y += '57     Caustic Fiend          0/1 30 1000000 ACID_SHIELD\n';
	y += '58     Static Charged         0/1 30 1000000 LIGHTNING_SHIELD\n';
	y += '```';
	z += '```\n';
	z += '59     Speed Freak            0/1 24 600000 HASTE\n';
	z += '60     Ghost                  0/1 13 200000 IMPROVED_INVISIBILITY\n';
	z += '61     Man of Steel           0/1 13 100000 STEELSKIN\n';
	z += '62     Can\'t Stop, Won\'t Stop 0/1 13 100000 FREE_ACTION\n';
	z += '63     Regenerator            0/1  5  20000 RECUPERATE\n';
	z += '64  (P)Arctic Legend          0/1  4 100000 Turns you into a Legendary\n';
	z += '												character.\n';
	if (clas.toLowerCase() == "thief") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 3 superb weapon skills.\n';
		z += '	   Requires skill hide (superb)\n';
		z += '	   Requires skill sneak (superb)\n';
		z += '	   Requires skill backstab (superb)\n';
		z += '	   Requires skill pick (superb)\n';
		z += '	   Requires skill dodge (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill disable (superb)\n';
		z += '	   Requires skill steal (superb)\n';
		z += '	   Requires skill detect (superb)\n';
		z += '	   Requires skill envenom (superb)\n';
		z += '	   Requires skill case (superb)\n';
		z += '	   Requires skill unbalance (superb)\n';
		z += '	   Requires skill plant (superb)\n';
		z += '	   Requires skill fade (superb)\n';
		z += '	   Requires skill evade (superb)\n';
		z += '	   Requires skill throat punch (superb)\n';
		z += '	   Requires skill coup (superb)\n';
		z += '56     Legendary Backstab     0/1  4  40000 skill backstab by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '57     Legendary Coup         0/1  3  30000 skill coup by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '58     Legendary Dodge        0/1  3  30000 skill dodge by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '59     Legendary Envenom      0/1  2  20000 skill envenom by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '60     Legendary Fade         0/1  2  20000 skill fade by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '61     Legendary Pick         0/1  1  12000 skill pick by 5\n';
		z += '	   Requires: Arctic Legend\n';
	} else 
		
	if (clas.toLowerCase() == "cleric") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 1 superb weapon skill.\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill turn (superb)\n';
		z += '	   Requires skill scribe (superb)\n';
		z += '	   Requires skill brew (superb)\n';
		z += '	   Requires skill meditate (superb)\n';
		z += '	   Requires spell: \'animate dead\'\n';
		z += '	   Requires spell: \'heal\'\n';
		z += '	   Requires spell: \'gate\'\n';
		z += '	   Requires spell: \'restoration\'\n';
		z += '	   Requires spell: \'holy word\'\n';
		z += '	   Requires spell: \'steelskin\'\n';
		z += '	   Requires spell: \'summoning circle\'\n';
		z += '65     Legendary Animate Dead 0/1  4  40000 PETS_LIMIT by 1\n';
		z += '	   Requires: Arctic Legend\n';
		z += '66     Legendary Free Action  0/1  3  30000 WIS by 2\n';
		z += '	   Requires: Arctic Legend\n';
		z += '67     Legendary Heal         0/1  4  40000 spell slots by 1 at level 6\n';
		z += '	   Requires: Arctic Legend\n';
		z += '68     Legendary Heroism      0/1  1  12000 spell slots by 1 at level 4\n';
		z += '	   Requires: Arctic Legend\n';
		z += '69     Legendary Steelskin    0/1  3  30000 spell slots by 1 at level 8\n';
		z += '	   Requires: Arctic Legend\n';
		z += '70     Legendary Strength Of One 0/1  2  20000 spell slots by 1 at level 7\n';
		z += '	   Requires: Arctic Legend\n';
	} else
	
	if (clas.toLowerCase() == "druid") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 1 superb weapon skill.\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill scribe (superb)\n';
		z += '	   Requires skill brew (superb)\n';
		z += '	   Requires skill commune with nature (superb)\n';
		z += '	   Requires spell: \'fire storm\'\n';
		z += '	   Requires spell: \'stone skin\'\n';
		z += '	   Requires spell: \'insect swarm\'\n';
		z += '	   Requires spell: \'iceshield\'\n';
		z += '	   Requires spell: \'enlarge\'\n';
		z += '	   Requires spell: \'barrier\'\n';
		z += '	   Requires spell: \'tornado\'\n';
		z += '65     Legendary Enlarge      0/1  2  20000 spell slots by 1 at level 4\n';
		z += '	   Requires: Arctic Legend\n';
		z += '66     Legendary Entangle     0/1  2  20000 spell slots by 1 at level 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '67     Legendary Healing Cloud 0/1  3  30000 HEALING_BONUS by 20\n';
		z += '	   Requires: Arctic Legend\n';
		z += '68     Legendary Primal Fury  0/1  3  30000 spell slots by 1 at level 7\n';
		z += '	   Requires: Arctic Legend\n';
		z += '69     Legendary Stone Skin   0/1  4  40000 spell slots by 1 at level 8\n';
		z += '	   Requires: Arctic Legend\n';
		z += '70     Legendary Storm Call   0/1  1  12000 WIS by 2\n';
		z += '	   Requires: Arctic Legend\n';
		z += '71     Legendary Ice Storm    0/1  2  20000 spell slots by 1 at level 5\n';
		z += '	   Requires: Arctic Legend\n';
	} else
		
	if (clas.toLowerCase() == "warrior") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 3 superb weapon skills.\n';
		z += '	   Requires skill kick (superb)\n';
		z += '	   Requires skill bash (superb)\n';
		z += '	   Requires skill rescue (superb)\n';
		z += '	   Requires skill track (superb)\n';
		z += '	   Requires skill disarm (superb)\n';
		z += '	   Requires skill parry (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill target (superb)\n';
		z += '	   Requires skill punch (superb)\n';
		z += '	   Requires skill danger sense (superb)\n';
		z += '	   Requires skill vigor (superb)\n';
		z += '56     Legendary Bash         0/1  4  40000 skill bash by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '57     Legendary Disarm       0/1  1  12000 skill disarm by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '58     Legendary Kick         0/1  3  30000 skill kick by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '59     Legendary Parry        0/1  2  20000 skill parry by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '60     Legendary Punch        0/1  3  30000 skill punch by 5\n';
		z += '	   Requires: Arctic Legend\n';
		z += '61     Legendary Target       0/1  2  20000 skill target by 5\n';
		z += '	   Requires: Arctic Legend\n';
	} else 
		
	if (clas.toLowerCase() == "paladin") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 2 superb weapon skills.\n';
		z += '	   Requires skill rescue (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill lay (superb)\n';
		z += '	   Requires skill turn (superb)\n';
		z += '	   Requires skill march (superb)\n';
		z += '	   Requires skill guard (superb)\n';
		z += '	   Requires skill avenging faith (superb)\n';
		z += '	   Requires skill rally (superb)\n';
		z += '	   Requires skill strike (superb)\n';
		z += '	   Requires skill divine focus (superb)\n';
		z += '	   Requires skill beseech (superb)\n';
		z += '	   Requires skill righteous will (superb)\n';
		z += '	   Requires skill reckoning (superb)\n';
		z += '62     Legendary Avenging Faith 0/1  3  30000 skill avenging faith by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '63     Legendary Holy Arms    0/1  2  20000 spell slots by +1 for all\n';
		z += '                                                spell levels\n';
		z += '	          Requires: Arctic Legend\n';
		z += '64     Legendary Lay          0/1  3  30000 skill lay by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '65     Legendary Rally        0/1  3  30000 skill rally by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '66     Legendary Righteous Indignation 0/1  1  12000 STR by 2\n';
		z += '	          Requires: Arctic Legend\n';
		z += '67     Legendary Strike       0/1  3  30000 skill strike by 5\n';
		z += '	          Requires: Arctic Legend\n';
	} else
		
	if (clas.toLowerCase() == "dark knight") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 2 superb weapon skills.\n';
		z += '	   Requires skill rescue (superb)\n';
		z += '	   Requires skill disarm (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill drain (superb)\n';
		z += '	   Requires skill gaze (superb)\n';
		z += '	   Requires skill march (superb)\n';
		z += '	   Requires skill stance (superb)\n';
		z += '	   Requires skill impair (superb)\n';
		z += '	   Requires skill inspire (superb)\n';
		z += '	   Requires skill thrust (superb)\n';
		z += '	   Requires spell: \'unholy wrath\'\n';
		z += '	   Requires spell: \'impunity\'\n';
		z += '	   Requires spell: \'dark blessing\'\n';
		z += '62     Legendary Drain        0/1  2  20000 skill drain by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '63     Legendary Impair       0/1  3  30000 skill impair by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '64     Legendary Soul Leech   0/1  2  20000 STR by 2\n';
		z += '	          Requires: Arctic Legend\n';
		z += '65     Legendary Stance       0/1  3  30000 skill stance by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '66     Legendary Thrust       0/1  3  30000 skill thrust by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '67     Legendary Unholy Might 0/1  2  20000 spell slots by +1 for all\n';
		z += '	                                               spell levels\n';
		z += '	          Requires: Arctic Legend\n';
	} else
		
	if (clas.toLowerCase() == "barbarian") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 2 superb weapon skills.\n';
		z += '	   Requires skill rescue (superb)\n';
		z += '	   Requires skill track (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill carve (superb)\n';
		z += '	   Requires skill lore (superb)\n';
		z += '	   Requires skill recuperate (superb)\n';
		z += '	   Requires skill wardance (superb)\n';
		z += '	   Requires skill sharpen (superb)\n';
		z += '	   Requires skill mend (superb)\n';
		z += '	   Requires skill charge (superb)\n';
		z += '	   Requires skill assail (superb)\n';
		z += '	   Requires skill battle cry (superb)\n';
		z += '	   Requires skill healdance (superb)\n';
		z += '	   Requires skill wilddance (superb)\n';
		z += '	   Requires skill into the breach (superb)\n';
		z += '	   Requires skill gore (superb)\n';
		z += '56     Legendary Assail       0/1  3  30000 skill assail by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '57     Legendary Lore         0/1  3  30000 skill lore by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '58     Legendary Battle Cry   0/1  3  30000 skill battle cry by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '59     Legendary Charge       0/1  4  40000 skill charge by 5\n';
		z += '	         Requires: Arctic Legend\n';
		z += '60     Legendary Healdance    0/1  2  20000 skill healdance by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '61     Legendary Wardance     0/1  2  20000 skill wardance by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '62     Legendary Wilddance    0/1  2  20000 skill wilddance by 5\n';
		z += '	          Requires: Arctic Legend\n';
	} else
		
	if (clas.toLowerCase() == "scout") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 3 superb weapon skills.\n';
		z += '	   Requires skill hide (superb)\n';
		z += '	   Requires skill sneak (superb)\n';
		z += '	   Requires skill rescue (superb)\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill target (superb)\n';
		z += '	   Requires skill shoot (superb)\n';
		z += '	   Requires skill scout (superb)\n';
		z += '	   Requires skill fade (superb)\n';
		z += '	   Requires skill hunt (superb)\n';
		z += '	   Requires skill camp (superb)\n';
		z += '	   Requires skill evade (superb)\n';
		z += '	   Requires skill fence (superb)\n';
		z += '	   Requires skill riposte (superb)\n';
		z += '	   Requires skill instinct (superb)\n';
		z += '	   Requires skill wildfire (superb)\n';
		z += '58     Legendary Harrier      0/1  2  20000 INSTINCT_D2_LIMIT by 1\n';
		z += '	          Requires: Arctic Legend\n';
		z += '59     Legendary Kingfisher   0/1  3  30000\n';
		z += '	          Requires: Arctic Legend\n';
		z += '60     Legendary Mockingbird  0/1  3  30000\n';
		z += '	          Requires: Arctic Legend\n';
		z += '61     Legendary Owl          0/1  2  20000\n';
		z += '	          Requires: Arctic Legend\n';
		z += '62     Legendary Roc          0/1  4  40000\n';
		z += '	          Requires: Arctic Legend\n';
		z += '63     Legendary Swan         0/1  1  12000 INSTINCT_D1_LIMIT by 1\n';
		z += '	          Requires: Arctic Legend\n';
	} else
		
	if (clas.toLowerCase() == "shaman") {
		z += '	   Requires: Rank 20\n';
		z += '	   Requires 1 superb weapon skill.\n';
		z += '	   Requires skill bandage (superb)\n';
		z += '	   Requires skill brew (superb)\n';
		z += '	   Requires skill taunt (superb)\n';
		z += '	   Requires skill control (superb)\n';
		z += '	   Requires skill hex (superb)\n';
		z += '	   Requires skill bind (superb)\n';
		z += '	   Requires skill spook (superb)\n';
		z += '	   Requires skill stupefy (superb)\n';
		z += '	   Requires skill field medic (superb)\n';
		z += '	   Requires skill frenzy (superb)\n';
		z += '	   Requires skill call spirits (superb)\n';
		z += '	   Requires skill banish (superb)\n';
		z += '	   Requires skill seance (superb)\n';
		z += '	   Requires spell: \'nap\'\n';
		z += '	   Requires spell: \'rotting flesh\'\n';
		z += '	   Requires spell: \'ghostskin\'\n';
		z += '	   Requires spell: \'last chance\'\n';
		z += '	   Requires spell: \'ethereal armor\'\n';
		z += '	   Requires spell: \'healing wave\'\n';
		z += '	   Requires spell: \'darkened soul\'\n';
		z += '65     Legendary Control      0/1  3  30000 PETS_LIMIT by 2\n';
		z += '	          Requires: Arctic Legend\n';
		z += '66     Legendary Frenzy       0/1  3  30000 skill frenzy by 5\n';
		z += '	          Requires: Arctic Legend\n';
		z += '67     Legendary Ghostskin    0/1  2  20000 spell slots by 1 at level 7\n';
		z += '	          Requires: Arctic Legend\n';
		z += '68     Legendary Omen         0/1  3  30000 spell slots by 1 at level 8\n';
		z += '	          Requires: Arctic Legend\n';
		z += '69     Legendary Regenerate   0/1  4  40000 spell slots by 1 at level 6\n';
		z += '	          Requires: Arctic Legend\n';
		z += '70     Legendary Tenacious Heart 0/1  1  12000 spell slots by 1 at level 5\n';
		z += '	          Requires: Arctic Legend\n';
	}
	
	z += '```';
	let aa =[x,y,z];
	return aa;
}
function addEmojis(longname) {
	for (let i=0;i<Emojis.length;i++) {
		if (longname.match(Emojis[i][0])) {
			if (longname.includes(Emojis[i][1])) {
				longname = longname.replace(Emojis[i][1], Emojis[i][2]);
				return longname;
			} else {return longname;}
		} else {
			return longname;
		}
	}
}
function showStats(message,args,command) {
	let zonecount = 0;
	let spellcount = 0;
	let dirscount = 0;
	let logcount = 0;
	if (debug) {console.log("[SHOWSTATS]Processing");}
	sqlStr = "SELECT idzones FROM zones";
	try {
		runQuery(sqlStr, function(rows) {
			zonecount = rows.length;
			sqlStr = "SELECT idspells FROM spells";
			try {
				runQuery(sqlStr, function(rows) {
					spellcount = rows.length;
					sqlStr = "SELECT iddirections FROM directions";
					try {
						runQuery(sqlStr, function(rows) {
							dirscount = rows.length;
							sqlStr = "SELECT idzones FROM zones WHERE logfile != ''";
							try {
								runQuery(sqlStr, function(rows) {
									logcount = rows.length;
									if (checkAdminRights(message)) {
										message.channel.send("**Zones :** `"+zonecount+"`  **Spells :** `"+spellcount+"`  **Dirs :** `"+dirscount+"`  **Logs :** `"+logcount+"`");
									} else {message.channel.send("**Zones :** `"+zonecount+"`");}
								},args,message,command)
							}
							catch(err) {
								message.channel.send("**Zones :** `"+zonecount+"`  **Spells :** `"+spellcount+"`  **Dirs :** `"+dirscount+"`  **Logs :** `<ERROR>`");
								console.log("[sS]Error Caught: "+err);
							}
						},args,message,command)
					}
					catch(err) {
						message.channel.send("**Zones :** `"+zonecount+"`  **Spells :** `"+spellcount+"`  **Dirs :** `<ERROR>`  **Logs :** `<N/A>`");
						console.log("[sS]Error Caught: "+err);
					}
				},args,message,command)
			}
			catch(err) {
				message.channel.send("**Zones :** `"+zonecount+"`  **Spells :** `<ERROR>`  **Dirs :** `<N/A>`  **Logs :** `<N/A>`");
				console.log("[sS]Error Caught: "+err);
			}
		},args,message,command)
	}
	catch(err) {
		message.channel.send("**Zones :** `<ERROR>`  **Spells :** `<N/A>`  **Dirs :** `<N/A>`  **Logs :** `<N/A>`");
		console.log("[sS]Error Caught: "+err);
	}
}
function argsIgnored(start,message,args) {
	if (debug) {console.log("[aI]Processing");}
	let x='';
	for (let i=start;i<args.length;i++) {if (i!=start) {x+=" ";}x+=args[i];}
	if (x != '') {message.author.send("FYI, the arguments '"+x+"' were ignored.");}
}
function Error(msg,args,message,command) {
	console.log(msg);
	SWM(msg,args,message,command);
}
function runLBQuery(query, fn, args, message, command) {
	/*
	console.log("[RunLBQuery]Processing . . .");
	let tempquery = query.replace(";","");
	let tempquery1 = tempquery.replace("'","\'");
	query = tempquery1;
	lorebotpool.getConnection((err,connection)=>{
		if (err) {
			connection.release();
			console.log({"code":100,"status":"Error in db connection in pool.getConnect([RLBQ])"});
			fn("err");
		} else {
			connection.query(query,(err,rows) => {
				if (!err) {
					// Return the Rows from the requested Query
					fn(rows);
				} else {
					// Error with SQL Query - shouldn't happen often
					Error("[RLBQ]Query: "+query+"\n[RLBQ]SQL Error: "+err, args, message, command);
					fn("err");
				}
			});
		}
	});
	*/
}
function runQuery(query, fn, args, message, command) {
	if (debug) {console.log("[RunQuery]Processing . . .");}
	let tempquery = query.replace(";","");
	let tempquery1 = tempquery.replace("'","\'");
	query = tempquery1;
	pool.getConnection((err,connection)=>{
		if (err) {
			connection.release();
			console.log({"code":100,"status":"Error in db connection in pool.getConnect([RQ])"});
			fn("err");
		} else {
			connection.query(query,(err,rows) => {
				if (!err) {
					// Return the Rows from the requested Query
					fn(rows);
				} else {
					// Error with SQL Query - shouldn't happen often
					Error("[RQ]Query: "+query+"\n[RQ]SQL Error: "+err, args, message, command);
					fn("err");
				}
			});
		}
	});
}
function listPrep(args,message,command,fn) {
	if (debug) {console.log("[lP]Processing...");}
	let x = '';
	let y = '';
	let fail = false
	var embed = new Discord.RichEmbed()
	sqlStr = "SELECT * FROM prep";
	try {
		runQuery(sqlStr, function(rows) {
			let types = rows[0].type.split(",");
			args.forEach((data,index) => {
				if(types.indexOf(data) === -1) {
					console.log("[lP]chosen type failure ("+data+")");
					fail = true;
				}
			});
			if (fail === true) {
				fn("One or more of the chosen types is unrecognized.");
			} else {
				let xx = 0;
				sqlStr = "SELECT * FROM prep WHERE (";
				args.forEach((data,index) => {
					if (xx != 0) {sqlStr += " OR ";}
					xx++;
					sqlStr += "type LIKE '%"+data+"%'";
				});
				sqlStr += ") AND idprep > 1";
				if (debug) {console.log("sqlStr: "+sqlStr);}
				runQuery(sqlStr, function(rows) {
					args.forEach((data,index) => {
						//embed.setAuthor("Heal Prep Items",client.user.avatarURL);
						embed.setTitle(ucFirstAllWords(data)+" Prep Items");
						//embed.setTimestamp();
						for (let i=0;i<rows.length;i++) {
							y = '';
							y += ":";
							if (rows[i].name.indexOf("potion") != -1 || rows[i].name.indexOf("vial") != -1 || rows[i].name.indexOf("flask") != -1) {y += "wine_glass";} 
							else if (rows[i].name.indexOf("scroll") != -1) {y += "scroll";}
							else {y += "point_right";}
							y += ": **"+rows[i].name+"**";
							x = '_**Corrupt Data**_';
							if (rows[i].type.indexOf(data) != -1) {
								getLongName(rows[i].zone, function(longname) {
									x = '';
									switch(data) {
										case 'immune':
											x += "Immunity : "+rows[i].immtype+"\n";
											break;
										case 'charmy':
											x += "Keyword : "+rows[i].keyword+"\n";
											break;
										case 'ds':
											x += "Type : "+rows[i].dstype+"\n";
											break;
										case 'cure':
											x += "Rentable : ";
											if (rows[i].notes.indexOf("rentable") != -1) {x += "Yes\n";}
											else if (rows[i].notes.indexOf("norent") != -1) {x += "No\n";}
											else {x += "Unknown\n";}
											x += "Spell : "+rows[i].curespell+"\n";
											break;
										case 'heal':
											x += "Rentable : ";
											if (rows[i].notes.indexOf("rentable") != -1) {x += "Yes\n";}
											else if (rows[i].notes.indexOf("norent") != -1) {x += "No\n";}
											else {x += "Unknown\n";}
											break;
										case 'aoe':
											x += "Spell : "+rows[i].aoespell+"\n";
											break;
										case 'buff':
											x += "Buffs : "+rows[i].buffs+"\n";
											break;
										case 'misc':
											x += "Spell : "+rows[i].miscspell+"\n";
											break;
										case 'limdam':
											x += "How LimDam : "+rows[i].howlimdam+"\n";
											break;
										default:
									}
									x += "loads in **"+toTitleCase(longname)+"** on **"+toTitleCase(rows[i].mob)+"**\n";
									if (rows[i].notes != "" && rows[i].notes != null) {
										x += "  Notes: "+rows[i].notes+"\n"; 
									}
								});
							}
							if (x != '_**Corrupt Data**_') {embed.addField(y,x);}
						}
						fn({embed});
						embed = new Discord.RichEmbed()
					});
					if (debug) {console.log("[lP]Processing Complete.");}
				},args,message,command);
			}
		},args,message,command);
	}
	catch(err) {
		console.log("[lP]Processing Failed: Error Caught: "+err);
	}
}
function showPrepHelp(args,message,command,fn) {
	if (debug) {console.log("[sPH]Processing...");}
	let x = '';
	let y = 0;
	x += '```css\n[+prep help]```\n';
	x += '```+prep <type> <type>\n\n';
	x += 'Types: ';
	sqlStr = "SELECT type FROM prep WHERE idprep = 1";
	try {
		runQuery(sqlStr, function(rows) {
			for (let i=0;i<rows.length;i++) {
				let types = rows[i].type.split(",");
				types.forEach((data,index) => {
					if (y!=0) {x += "|";}
					y++;
					x += data;
				});				
			}
			x += '\n\nThis will list prep item information for the chosen type(s).';
			x += '```\n';
			if (debug) {console.log("[sPH]Processing Complete.");}
			fn(x);
		},args,message,command);
	}
	catch(err) {
		console.log("[sPH]Processing Failed: Error Caught: "+err);
	}
}
function showRandomzoneHelp() {
	let x = '';
	x += '```css\n[+randomzone help]```\n';
	x += '**+randomzone <tier>**\n';
	x += '\trandomly chooses a zone for you to run (from the chosen tier)\n';
	x += '\tTiers:\n';
	x += '\t\t1 : Level 1 through 15\n';
	x += '\t\t2 : Level 15 through 20\n';
	x += '\t\t3 : Level 20 through 25\n';
	x += '\t\t4 : Level 25 through 30\n';
	x += '\t\t5 : Level 30\n';
	return x;
}
function showSendlogHelp() {
	let x = '';
	x += '```css\n[+sendlog help]```\n';
	x += '**+sendlog <zone>**\n';
	x += 'use **+zoneinfo** to see if there is a log available\n\n';
	x += '**[ MESSAGE ME (+update) IF YOU HAVE LOGS ]**\n';
	x += '** I can simplify them and post them **';
	return x;
}
function showLegendHelp() {
	let x = '';
	x += '```css\n[+legend help]```\n';
	x += '**[THIS FEATURE IS CURRENTLY A WORK IN PROGRESS]**\n\n';	
	x += '**+legend <class>**\n';
	x += '\tshows Legend info for <class>\n';
	x += '\tshows **all** available Legend Shop purchases\n';
	x += '\teven some that aren\'t available to <class>\n';
	return x;
}
function showListHelp() {
	let x = '';
	x += '```css\n[+list help]```\n';
	x += '**[THIS FEATURE IS CURRENTLY A WORK IN PROGRESS]**\n\n';
	x += '**+list <option>**\n';
	x += '\tAvailable Options:\n';
	x += '\t\t**learn** - lists +learn items and where they drop\n';
	x += '\t\t**alchemists** - lists where all the alchemists are\n';
	x += '\t\t**dragons** - lists all the dragons in the game\n';
	x += '\t\t**hitroll** - lists known hitroll items\n';
	return x;
}
function showLocateHelp() {
	let x = '';
	x += '```css\n[+locate help]```\n';
	x += '**+locate <zone>**\n';
	x += '\t*shows where to locate from and what to locate for <zone>*\n';
	x += '\t**[CALLING ALL MAGE EXPERTS]**\n';
	x += '\t***Little to No locate information in my database***\n';
	x += '\t***Please use +update to remedy that!***';
	return x;
}
function showZonesHelp() {
	let x = '';
	let aa = '```\t';
	let y = 0;
	x += '```css\n[+zones help]```\n';
	x += '**+zones** <filter>\n';
	x += '\tif <filter> is provided, it shows zones whos longname matches the filter\n';
	x += '\tif <filter> is not provied, it shows all zones (multiple messages)\n';
	x += '\tif <filter> is the word `tier` and followed by a number from 0 to 5\n';
	x += '\t  then it will show the zones for that tier\n';
	x += '\tif <filter> is the word `area` and followed by one of the following:\n';
	AvailableAreas.forEach((data,index) => {
		aa += createSpace(data,7)+"|";
		if (y == 4) {aa += "\n\t";y=0;}
		else {y++;}
	});
	aa += '```';
	x += aa;
	x += '\t  then it will show the zones around that area\n';
	x += '\tif <filter> is the word `alignment` followed by `good` or `evil` or `neutral`\n';
	x += '\t  then it will show all the zones of that alignment\n';
	x += '\n\tthis command shows the shortname, longname and tier of filtered zones';
	return x;
}
function showZoneinfoHelp() {
	let x = '';
	x += '```css\n[+zoneinfo help]```\n';
	x += '**+zoneinfo <zone>**\n';
	x += '\t*Alignment* is what alignment the mobs in the zone are\n';
	x += '\t*Dirs to* | +dirs <thiszone> <listzone>\n';
	x += '\t*Dirs from* | +dirs <listzone> <thiszone>';
	return x;
}
function showDirsHelp() {
	let x = '';
	x += '```css\n[+dirs help]```\n';
	x += '**+dirs <startzone> <endzone>**\n\tShows directions between the Start and End zones\n\tUse +zoneinfo to find available +dirs';
	return x;
}
function showSpellsHelp() {
	let x = '';
	x += '```css\n[+spells help]```\n';
	x += '**+spells <class> list**\n\toutputs full spell list like arctic "spells" command\n';
	x += '**+spells <class>**\n\toutputs all spells/drop locations for <class>\n';
	x += '\tCleric, Druid and Shaman only for now\n';
	x += '**+spells name <filter>**\n\tshows all spells whose name contains <filter>';
	return x;
}
function getDirectionsList(shortname, fn) {
	// This will return the TO and FROM dirs list for a zone (used with +zoneinfo)
	if (debug) {console.log("[GDL]Processing: \'"+shortname+"\'");}
	sqlStr = "SELECT * FROM directions WHERE startlocation = '"+shortname+"'";
	try {
		runQuery(sqlStr, function(rows) {
			let ToList = "";
			let DirsList = [];
			for (let i=0;i<rows.length;i++) {
				if (i != 0) {ToList += ", ";}
				ToList += rows[i].endlocation;
			}
			DirsList[0] = ToList;
			sqlStr = "SELECT * FROM directions WHERE endlocation = '"+shortname+"'";
			try {
				runQuery(sqlStr, function(rows) {
					let FromList = "";
					for (let i=0;i<rows.length;i++) {
						if (i != 0) {FromList += ", ";}
						FromList += rows[i].startlocation;
					}
					DirsList[1] = FromList;
					fn(DirsList);					
				});	
			}
			catch(err) {
				console.log("[gDL]Error Caught: "+err);
			}
		});
	}
	catch(err) {
		console.log("[gDL]Error Caught: "+err);
	}
}
function getLongName(shortname, fn) {
	if (debug) {console.log("[GLN]Processing '"+shortname+"'. . .");}
	if (shortname == "unknown") {
		fn("unknown");
	} else {
		ShortLongZones.forEach((data,index) => {
			let data0 = data[0]; // shortname of first zone
			let data1 = data[1]; // longname of first zone
			let shortnames = shortname.split(","); // breaks out the zone names for comparison
			shortnames.forEach((datan,index) => {  // cycle through the list of zones (shortnames)
				let data2 = datan; // shortname of the first zone in the list that was passed
				if (data0 == data2) { // compare it to the cycle we are on (data[0])
					let newLongname = addEmojis(data1);
					fn(newLongname); // send the longname back
				}
			});
		});
	}
}
function ucFirstAllWords( str ) {
	try {
		var pieces = str.split(" ");
		for ( var i = 0; i < pieces.length; i++ )
		{
			var j = pieces[i].charAt(0).toUpperCase();
			pieces[i] = j + pieces[i].substr(1);
		}
		return pieces.join(" ");
	}
	catch(err) {
		console.log("[ucFAW]Error Caught: "+err);
		return "<blank>";
	}
}
function createSpace(str,totalspace) {
	if (debug) {console.log("[cS]Processing");}
	let y = '';
	strlen = str.length;
	spaceNeeded = totalspace - strlen;
	for (let i=0;i<Math.ceil(spaceNeeded/2);i++) {y += " ";}
	y += str;
	for (let i=0;i<Math.floor(spaceNeeded/2);i++) {y += " ";}
	return y;
}
function STM(message,args,command) {
	// (S)end (T)im (M)essage
	// will need this function to get this bot added to a room
	let x='';
	let y='';
	let z=[];
	x += args.join(" ");
	if (x == "") {x = "<blank>";}
	//client.fetchUser("218413416824569858").then(function(user) {  <-- tim
	client.fetchUser("219104726321594369").then(function(user) {	// <-- derek
	//client.fetchUser("320994347824971778").then(function(user) {	// <-- gramm
		// These are the fields available in the newly built user object
		// id, username, discriminator, avatar, bot, lastmessageid, lastmessage
		user.send({embed: {
			color: 3447003,
			author: {
			  name: client.user.username,
			  icon_url: client.user.avatarURL
			},
			title: "Arctic.LIB Requesting Access",
			url: "http://arcticmud.org/",
			description: "Hello Gramm!  I am a `BOT` created to house all information for Arctic in a single, accessible location.",
			fields: [{
				name: "Test Me Out",
				value: "**+help** will show you how I work (DM me!)"
			  },
			  {
				name: "Add Arctic.LIB",
				value: "Click here to [Add Arctic.LIB](https://discordapp.com/oauth2/authorize?client_id=377843327082561541&scope=bot) Through this link you can add me to the Myth server."
			  },
			  {
				name: "We can Chat!",
				value: "You can **+message** the builder as well.  They wish to remain anonymous for now."
			  },
			  {
				name: "This message is not a mass message!",
				value: "This message was sent to you, Gramm, because I believe you have power to add me.  If you do not, please let me know who does!"
			  }
			],
			timestamp: new Date(),
			footer: {
			  icon_url: client.user.avatarURL,
			  text: "© Arctic.LIB 2018"
			}
		}});
	});
}
function SWM(msg,args,message,command) {
	// (S)end (W)yndz (M)essage
	let x='';
	for (let i=0;i<args.length;i++) {if (i!=0) {x+= " ";}x += args[i];}
	let tempMsg = "Command: "+command+"\nArgs: "+x+"\nMsg: "+msg;
	tempMsg += "\nFrom: "+message.author.username;
	client.fetchUser("219104726321594369").then(user => {user.send(tempMsg)});
}
function DoesZoneExist(Zone,message,fn,args,command) {
	if (debug) {console.log("[DZE]Processing: \'"+Zone+"\'");}
	
	let Arg0 = false;
	let Arg1 = false;
	if (Zone == args[0]) {Arg0 = true;}
	else if (Zone == args[1]) {Arg1 = true;}
	
	var tempZone = Zone.replace("'","\\'");
	sqlStr = "SELECT * FROM zones WHERE (shortname = '"+tempZone+"') OR (longname = '"+tempZone+"')";
	try {
		runQuery(sqlStr, function(rows) {
			if (rows.length === 0) {
				// Now, check for 1 row of "like" longname
				sqlStr = "SELECT * FROM zones WHERE longname LIKE '%"+tempZone+"%' OR shortname LIKE '%"+tempZone+"%'";
				try {
					runQuery(sqlStr, function(rows) {
						if (rows.length === 1) {
							fn(rows[0]);
						} else if (rows.length > 1) {
							// +dirs "village" gets you here, need to update this to work better
							if (Arg0) {
								argsIgnored(1,message,args);
								message.author.send("There were multiple options for **"+args[0]+"**");
							}
							else if (Arg1) {
								argsIgnored(2,message,args);
								message.author.send("**"+args[0]+"** was found, but **"+args[1]+"** has multiple options");
							}
							
							od  = "";
							od += "**Arctic.lib** ---> Available Zones to Locate";
							od += "\n";
							od += "---------------------------------\n";
							od += "```\n";
							od += "------- | ---------------------------- | ------\n";
							od += "-SHORT- | ------------LONG------------ | -TIER-\n";
							od += "------- | ---------------------------- | ------\n";
							for (let i=0;i<rows.length;i++) {
								od += createSpace(rows[i].shortname,7);
								od += " | ";
								od += createSpace(rows[i].longname,28);
								od += " | ";
								od += createSpace(rows[i].tier.toString(),6);
								od += "\n";
							}
							od += "```";
							message.author.send(od);
						} else {
							fn("no");
						}
					});
				}
				catch (err) {
					console.log("[DZE]Error Caught: "+err);
				}
			} else if (rows.length === 1) {
				// Arrive here when a zone was found
				fn(rows[0]);
			} else if (rows.length > 1) {
				// Arrive here when more than 1 zone was found - should not happen
				fn("twoplus");
			} else {
				// Arrive here when no zones were found
				fn("no");
			}
		});
	}
	catch(err) {
		console.log("[DZE]Error Caught: "+err);
	}
}
function DoesEndZoneExist(EndZone,StartZone,fn) {
	if (typeof StartZone === 'undefined') {fn("err");}
	if (typeof EndZone  === 'undefined') {fn("err");}
	pool.getConnection((err,connection)=>{
		if (err) {
			connection.release();
			console.log({"code":100,"status":"Error in db connection in pool.getConnect(callback)"});
			fn("err");
		} else {
			sqlStr = "SELECT * FROM directions WHERE startlocation = '"+StartZone+"' AND endlocation = '"+EndZone+"'";
			if (debug) {console.log("[DEZE]sqlStr: "+sqlStr);}
			connection.query(sqlStr,(err,rows) => {
				connection.release();
				if (!err) {
					if (rows.length === 1) {
						// Arrive here when a zone was found
						if (debug) {console.log("[DEZE]Rows(1): "+rows.length);}
						if (debug) {console.log("[DEZE]Zone Found! --> "+rows[0].endlocation);}
						fn(rows[0]);
					} else if (rows.length > 1) {
						// Arrive here when more than 1 zone was found - should not happen
						if (debug) {console.log("Inside DoesEndZoneExist() : Rows(2+): "+rows.length);}
						fn("twoplus");
					} else {
						// Arrive here when no zones were found
						if (debug) {console.log("Inside DoesEndZoneExist() : Rows(0): "+rows.length);}
						fn("no");
					}
				} else {
					// Error with SQL Query - shouldn't happen often
					console.log("SQL Error(2): "+err);
					fn("err");
				}
			});			
		}
	});
}
function ZoneInfoNameBrief(startzone,zonelist,brief,fn) {
	if (debug) {console.log("ZINB() -- CAUGHT!! -- Processing . . .");}
	pool.getConnection((err,connection)=>{
		if (err) {
			connection.release();
			console.log({"code":100,"status":"Error in db connection in pool.getConnect(callback)"});
			fn("err");
		} else {
			// Now has list of shortname zones
			if (debug) {console.log("[ZINB]zonelist typeof = "+typeof zonelist);}
			sqlStr = "SELECT * FROM zones WHERE ";
			for (let i=0;i<zonelist.length;i++) {
				if (i > 0) {sqlStr += " OR ";}
				sqlStr += "shortname like '%"+zonelist[i]+"%'";
			}
			if (debug) {console.log("[ZINB]sqlStr: "+sqlStr);}
			connection.query(sqlStr,(err,rows) => {
				connection.release();
				if (!err) {
					if (debug) {console.log("[ZINB]brief: "+brief);}
					if (rows.length >= 1) {
						if (!brief) {
							let returnData  = "```";
								returnData += "************************************************\n";
								returnData += " ShortName |      LongName      |    Command    \n";
								returnData += "------------------------------------------------\n";
							for (let j=0;j<rows.length;j++) {
								returnData += createSpace(rows[j].shortname,11);
								returnData += "|";
								returnData += createSpace(ucFirstAllWords(rows[j].longname),20);
								returnData += "| +dirs ";
								returnData += startzone;
								returnData += " ";
								returnData += rows[j].shortname;
								returnData += "\n";
							}
								returnData += "************************************************\n";
								returnData += "```";
								fn(returnData);
						} else {
							let returnData  = "```";
								returnData += "***********************************\n";
								returnData += " ShortName |        Command        \n";
								returnData += "-----------------------------------\n";
							for (let j=0;j<rows.length;j++) {
								returnData += createSpace(rows[j].shortname,11);
								returnData += "|";
								let c = "+dirs "+startzone+" "+rows[j].shortname;
								returnData += createSpace(c,23);
								returnData += "\n";
							}
							returnData += "***********************************\n";
							returnData += "```";
							fn(returnData);
						}						
					} else {
						/* no zones with that short name detected */
					}
				} else {
					// Error with SQL Query - shouldn't happen often
					console.log("SQL Error(1): "+err);
					fn("err");
				}
			});
		}
	});
}
function processRankMob(Mob,message) {
	if (debug) {console.log("[pRM]CAUGHT!! ("+Mob+", message) -- Processing . . .");}
	pool.getConnection((err,connection)=>{
		if (err) {
			connection.release();
			console.log({"code":100,"status":"Error in db connection in pool.getConnect(callback)"});
		} else {
			sqlStr = "SELECT * FROM rankmobs WHERE mob = '"+Mob+"'";
			if (debug) {console.log("[pRM]sqlStr: "+sqlStr);}
			connection.query(sqlStr,(err,rows) => {
				if (!err) {
					if (rows.length === 1) {
						// Exists
						connection.release();
						message.channel.send(Mob+" already flagged as Ranked");
					} else if (rows.length === 0) {
						// Needs to be Inserted
						sqlStr = "INSERT INTO rankmobs SET mob='"+Mob+"'";
						if (debug) {console.log("[pRM]sqlStr: "+sqlStr);}
						connection.query(sqlStr,(err,rows) => {
							connection.release();
							if (!err) {
								message.channel.send(Mob+" added to Ranked");
							} else {
								// SQL Error
								console.log("SQL Error(2): "+err);
								message.channel.send("Error adding << "+Mob+" >> to Ranked");
							}
						});
					} else if (rows.length > 1) {
						// More than 1 Entry
						connection.release();
						SWM("2 Rank Mobs with the same name: "+Mob, message, args, command);
						message.channel.send(Mob+" already flagged as Ranked");
					}
				} else {
					// SQL Error
					console.log("SQL Error(3): "+err);
				}
			});
		}
	});	
}

// *********************************************************
// *** These scripts are LoreBot and used only for debugging
// *** These are not part of Arctic.lib**
// *********************************************************
function ProcessQuery(message) {
  let queryParams = null;
  let whereClause = " WHERE 1=1 ";
  let searchField = null;
  let sqlStr = null;
  let subquery = null;
  let args = [];
  let dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
  let affectsArr = [];
  let half1, half2 = null; //for parsing affects in 'damroll by 3'   , half1 = damroll, half2 = 3
  let match = null; //for regexp string pattern matching
  let isExitLoop = false;
  let searchItem = "";

  //console.log(`${message.content.trim().length} : ${(config.prefix + "query").length}`);
  if (message.content.trim().length >(config.prefix + "query").length ) {
    queryParams = message.content.trim().substring((config.prefix + "query").length,message.content.trim().length).replace(/\+/g, '%2B');
    queryParams = queryParams.trim();
    if (queryParams.indexOf("=") > 0 || queryParams.indexOf(">") > 0 || queryParams.indexOf("<") > 0)  {
      args = querystring.parse(queryParams.trim());
	  console.log(args);
      for (let property in args) {
        if (Object.prototype.hasOwnProperty.call(args,property)) {    // https://github.com/hapijs/hapi/issues/3280
          console.log(`${property.padEnd(15)}: ${args[property]}`);

          switch(property.toLowerCase().trim()) {
            //do all the int based properties first
            case "speed":
            case "accuracy":
            case "power":
            case "charges":
            case "weight":
            case "item_value":
            case "apply":
            case "capacity":
            case "container_size":
              if (/(\d+)/g.test(args[property])) {    //ensure valid int
                //item_value is actually stored as varchar(10) as db level, so quote wrap it
                if (property.toLowerCase().trim() == "item value" || property.toLowerCase().trim() == "item_value" || property.toLowerCase().trim() == "value" ) {
                  whereClause += ` and Lore.${property.toUpperCase()}='${args[property]}' `;
                }
                else {
                  whereClause += ` and Lore.${property.toUpperCase()}=${args[property]} `;
                }
              }
              else {  //tell user we are expecting an int
                message.author.send(`${property.toUpperCase()} must be an integer (Example: !query ${property.toUpperCase()}=5)`);
              }
              break;
            case "item_type":
            case "item_is":
            case "submitter":
            case "restricts":
            case "class":
            case "mat_class":
            case "material":
            case "immune":
            case "effects":
            case "damage":
              whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
              break;
            case "affects":
              if (args[property].indexOf(",") > 0) {
                affectsArr = args[property].split(",");
                for (let i = 0; i < affectsArr.length; i++) {
                  half1 = null, half2 = null, match = null;             //initialize variables for regex pattern match results
                  if (affectsArr[i].trim().indexOf(' by ') > 0) {       // !query affects=damroll by 2,hitroll by 2
                    //console.log(`affectsArr[${i}]: ${affectsArr[i].trim()}`);
                    if (/^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.test(affectsArr[i].trim())) {
                      match = /^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.exec(affectsArr[i].trim());
                      if (match != null && match.length === 3) {      // think matching index [0,1,2] -> length = 3
                        half1 = match[1].trim();
                        var temphalf2 = match[2];
                        half2 = temphalf2.replace(/\+/g, '\\\\\+?');  // replaces all "+" with "\\+?"
                        
                        //console.log(`match[${i}]: ${half1} by ${half2}`);
                        whereClause += ` AND (Lore.${property.toUpperCase()} REGEXP '.*${half1}[[:space:]]+by[[:space:]]+${half2}.*' ) `
                      }
                    }
                    else {    // in a pattern of 'attribute by value', but it didn't match somehow, so just ignore for now, no query impact
                      console.log(`no match for ${affectsArr[i].trim()}`);
                    }
                  }
                  else {  //doesn't contain the string " by "
                    whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
                  }
                } //end for loop thru affectsArr
              }
              else {  //affects property value does not contain a comma ','
                half1 = null, half2 = null, match = null;             //initialize variables for regex pattern match results
				if (args[property].indexOf(' by ') > 0) {       // !query affects=damroll by 2,hitroll by 2
				  console.log(`${dateTime}` + args[property]);
                  //console.log(`affectsArr[${i}]: ${affectsArr[i].trim()}`);
                  if (/^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.test(args[property].trim())) {
                    match = /^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.exec(args[property].trim());
                    if (match != null && match.length === 3) {      // think matching index [0,1,2] -> length = 3
                      half1 = match[1].trim();
                      var temphalf2 = match[2];
                      half2 = temphalf2.replace(/\+/g, '\\\\\+?');  // replaces all "+" with "\\+?"
					  console.log(`${dateTime}` + " |half1: "+half1+" |half2: "+half2+" |temphalf2: "+temphalf2);
                      
                      //console.log(`match[${i}]: ${half1} by ${half2}`);
                      whereClause += ` AND (Lore.${property.toUpperCase()} REGEXP '.*${half1}[[:space:]]+by[[:space:]]+${half2}.*' ) `
                    }
                  }
                }
                else {
                  whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
                }
              }
              break;
            case "object_name":
              whereClause += ' AND Lore.OBJECT_NAME = ' + mysql.escape(args[property]);
              searchItem = args[property].trim();
              isExitLoop = true;
              break;
            default:
              message.author.send(`Invalid property '${property.toUpperCase()}' specified. Valid properties: \n`);
              message.author.send("```" + `ITEM_TYPE\nITEM_IS\nSUBMITTER\nAFFECTS\nAPPLY\nRESTRICTS\nCLASS\nMAT_CLASS\n` +
                                          `MATERIAL\nITEM_VALUE\nIMMUNE\nEFFECTS\nWEIGHT\nCAPACITY\nCONTAINER_SIZE\nSPEED\nACCURACY\nPOWER\nDAMAGE` + "```");
              break;
          } //end switch on property
        }  //end hasOwnProperty() test
        if (isExitLoop){
          //get out of the for loop because we used object_name
          break;
        }
      } //end for loop
      //console.log(whereClause);
      subquery = "SELECT COUNT(*) from Lore " + whereClause
      sqlStr = `SELECT (${subquery}) as LIST_COUNT, LORE_ID, OBJECT_NAME from Lore ${whereClause}`;
      //console.log(`${dateTime} : ${"SQL: ".padEnd(30)} ${sqlStr}`);
      console.log(`${dateTime} : ${message.author.username.toString().padEnd(30)} ${message.content.trim()}`);
      if (!isExitLoop) {
        DoFlexQueryDetail(message,sqlStr);
		//message.author.send("`"+ `${sqlStr}` +"`");
      }
      else {
        handle_database(message,whereClause,searchItem);
		//message.author.send("Went to the else under the main");
      }
    }
    else {
      //searchField = queryParams ;
      switch(queryParams.toLowerCase()) {
        case "item_is":
          searchField = queryParams.trim().toUpperCase();
          subquery = `SELECT COUNT(DISTINCT UPPER(Lore.${queryParams.toUpperCase()})) from Lore`;
          sqlStr = `SELECT DISTINCT UPPER(${queryParams.toUpperCase()}) as '${queryParams.toUpperCase()}', (${subquery}) as 'LIST_COUNT' ` +
                   ` FROM Lore WHERE Lore.${queryParams.toUpperCase()} IS NOT NULL ` +
                   ` ORDER BY UPPER(Lore.${queryParams.toUpperCase()})` +
                   ` LIMIT ${BRIEF_LIMIT};`;
          //console.log(`sqlStr: ${sqlStr}`);
          break;
        case "item_type":
        case "submitter":
        case "affects":
        case "restricts":
          // future todo - tokenize string using stored proc
          // https://stackoverflow.com/questions/1077686/is-there-something-analogous-to-a-split-method-in-mysql
        case "class":
        case "mat_class":
        case "material":
        case "immune":
        case "effects":
        case "damage":
          searchField = queryParams.trim().toUpperCase();
          subquery = `SELECT count(distinct UPPER(Lore.${searchField})) from Lore`;
          sqlStr = `SELECT distinct UPPER(${searchField}) as '${searchField}', (${subquery}) as 'LIST_COUNT' ` +
                   ` FROM Lore WHERE ${searchField} IS NOT NULL ` +
                   ` ORDER BY UPPER(${searchField}) ASC ` +
                   ` LIMIT ${BRIEF_LIMIT};`;
          //console.log(`sqlStr: ${sqlStr}`);
          break;
        default:
        message.author.send("```Invalid field query. Example fields:\nITEM_TYPE\nITEM_IS\nSUBMITTER\nAFFECTS\nRESTRICTS\nCLASS\nMAT_CLASS\nMATERIAL\nIMMUNE\nEFFECTS\nDAMAGE\nSPEED\nPOWER\nACCURACY" +
                            "```");
          break;
      }
      if (sqlStr != null) {
        //DoFlexQuery(message,searchField,sqlStr);
      }
    }
  }
  else {
    let padLen = 60;
    message.author.send("Invalid usage. Examples:" +
                        "\n!query affects".padEnd(padLen) + "(List all AFFECTS values)" +
                        "\n!query material=mithril".padEnd(padLen)  + "(Mithril items)" +
                        "\n!query affects=damroll by 2&material=cloth".padEnd(padLen) + "(Cloth 'DAMROLL by 2' items)" +
                        "\n!query material=mithril&damage=3d6" +
                        "\n!query affects=damroll by 2&item_type=worn" +
                        "\n!query affects=damroll by 2,hitroll by 2&item_type=worn".padEnd(padLen) + "(Worn items that are 'DAMROLL by 2, HITROLL by 2')", {code:true});
  }
  return; //done with ProcessQuery
}
/**
 * for !query command
 * which has a wide range of flexibility
 * @param {object} pMsg
 * @param {string} pSQL
 */
function DoFlexQueryDetail(pMsg,pSQL) {
  let sb = "";
  let sb1 = "";
  let totalItems = 0;

  lorebotpool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }

    connection.query(pSQL,(err,rows) => {

      connection.release();
      if (!err) {
        if (rows.length > 0) {
          totalItems = rows[0]["LIST_COUNT"];
		  let msg2 = false;
          for (let i = 0; i < Math.min(rows.length,BRIEF_LIMIT);i++) {
              if (sb.length < 1900) {
				sb += `Object '${rows[i]['OBJECT_NAME'].trim()}'\n`;
			  } else {
				if (!msg2) {msg2 = true;}
				sb1 += `Object '${rows[i]['OBJECT_NAME'].trim()}'\n`;
			  }
          }
          //console.log(`sb.length: ${sb.length}`); // for debugging: discord has a 2,000 character limit
          if (totalItems > BRIEF_LIMIT) {

            pMsg.author.send("```" + `${totalItems} items found. Displaying first ${BRIEF_LIMIT} items.\n` +
                    sb + "```");
          }
          else {
            if (pMsg.channel != null && pMsg.channel.name === config.channel) {
              if (totalItems == 1) {pMsg.channel.send(`${totalItems} item found.`) ;}
              else {pMsg.channel.send(`${totalItems} items found.`) ;}
			  if (msg2) {
				pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
				pMsg.channel.send(sb1,{code: true}).catch( (err,msg) => {
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
			  } 
			  else {
				pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
			  }
            }
            else {
              if (totalItems == 1) {pMsg.author.send(`${totalItems} item found.`) ;}
              else {pMsg.author.send(`${totalItems} items found.`) ;}
              if (msg2) {
				pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
				pMsg.author.send(sb1,{code: true}).catch( (err,msg) => {
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
			  } 
			  else {
				pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
				  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
				});
			  }
            }

          }
        }
        else {
          pMsg.author.send(`${totalItems} items found.`) ; // ie. 0
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};
/**
 * for !query command
 * which has a wide range of flexibility
 * @param {object} pMsg
 * @param {string} pField
 * @param {string} pSQL
 */
function DoFlexQuery(pMsg,pField,pSQL) {
  let FLEX_QUERY_LIMIT = 20;

  switch (pField) {
    case "CLASS":
    case "ITEM_TYPE":
    case "MAT_CLASS":
    case "MATERIAL":
    case "SUBMITTER":
      FLEX_QUERY_LIMIT=50;
      break;
    default:
      FLEX_QUERY_LIMIT=20;
      break;

  }
  lorebotpool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }

    connection.query(pSQL,(err,rows) => {
      let sb = "";
      let totalItems = 0;
      connection.release();
      if (!err) {
        if (rows.length > 0) {
          totalItems = rows[0]["LIST_COUNT"];
          for (let i = 0; i < Math.min(rows.length,FLEX_QUERY_LIMIT);i++) {
              sb += rows[i][pField].trim() + "\n";
          }
          //console.log(`sb.length: ${sb.length}`); // for debugging: discord has a 2,000 character limit
          if (totalItems > FLEX_QUERY_LIMIT) {

            pMsg.author.send("```" + `${totalItems} values found for '${pField}'. Displaying first ${FLEX_QUERY_LIMIT} items.\n` +
                    sb + "```");
          }
          else if (totalItems == 1) {
            pMsg.author.send(`${totalItems} value found for '${pField}'`) ;
            pMsg.author.send(sb, {code: true});
          }
          else {
            pMsg.author.send(`${totalItems} values found for '${pField}'`) ;
            pMsg.author.send(sb, {code: true});
          }
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};
function handle_database(pMsg,whereClause,pItem){
  let sqlStr = "";
  lorebotpool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }
    sqlStr = `SELECT * FROM Lore ${whereClause}`;
    //console.log(`sqlStr non-escaped: ${sqlStr}\n               sqlStr escaped: ${mysql.escape(sqlStr)}`);
    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
		console.log("[handle_database]"+`${moment().format(MYSQL_DATETIME_FORMAT)}: RowsLength: ${rows.length}`);
        if (rows.length >= 0) {
          if (rows.length === 1) {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} item found for '${pItem}'`) ;
          }
          else if (rows.length > MAX_ITEMS )          {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`);
          }
          else {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} item found for '${pItem}'`);
          }
          if (rows.length > 0) {
            return formatLore(pMsg,rows) ;
          }
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};
/**
 * This function is called after a user pastes a lore in chat typically -
 * then the db update stored procedure call is initiated
 * CreateUpdateLore typically called from parseLore()
 * @param {function} callback
 */
function CreateUpdateLore(objName,itemType,itemIs,submitter,affects,apply,restricts,weapClass,matClass,material,itemValue,extra,
                          immune,effects,weight,capacity,itemLevel,containerSize,charges,speed,accuracy,power,damage,callback) {
  let sqlStr = "";
  if (objName != null) {objName = objName.toString();}
  if (itemType != null) {itemType = itemType.toString();}
  if (itemIs != null) {itemIs = itemIs.toString();}
  if (submitter != null) {submitter = submitter.toString();}
  if (affects != null) {affects = affects.toString();}
  if (apply != null) {apply = apply.toString();}
  if (restricts != null) {restricts = restricts.toString();}
  if (weapClass != null) {weapClass = weapClass.toString();}
  if (matClass != null) {matClass = matClass.toString();}
  if (material != null) {material = material.toString();}
  if (itemValue != null) {itemValue = itemValue.toString();}
  if (extra != null) {extra = extra.toString();}
  if (immune != null) {immune = immune.toString();}
  if (effects != null) {effects = effects.toString();}
  if (weight != null) {weight = weight.toString();}
  if (capacity != null) {capacity = capacity.toString();}
  if (itemLevel != null) {itemLevel = itemLevel.toString();}
  if (containerSize != null) {containerSize = containerSize.toString();}
  if (charges != null) {charges = charges.toString();}
  if (speed != null) {speed = speed.toString();}
  if (accuracy != null) {accuracy = accuracy.toString();}
  if (power != null) {power = power.toString();}
  if (damage != null) {damage = damage.toString();}
  
  lorebotpool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in db connecion in CreateUpdateLore in pool.getConnect(callback)"});
      }
    // sqlStr = `call CreateLore('${objName}','${itemType}','${itemIs}','${submitter}','${affects}',${apply},'${restricts}',
    //                           '${weapClass}','${matClass}','${material}','${itemValue}','${extra}','${immune}','${effects}',${weight},
    //                           ${capacity},'${itemLevel}',${containerSize},${charges},${speed},${accuracy},
    //                           ${power},'${damage}')`;
    //console.log(`weight: ${weight}`)
    //console.log (`${submitter} attempt update/insert '${objName}'`);
    sqlStr = "call CreateLore(" + (((objName) ? `'${objName.replace("'","\\'")}'` : null) + "," +
                                  ((itemType) ? `'${itemType}'` : null) + "," +
                                  ((itemIs) ? `'${itemIs}'` : null) + "," +
                                  ((submitter) ? `'${submitter}'` : null) + "," +
                                  ((affects) ? `'${affects}'` : null) + "," +
                                  ((apply) ? apply : null) + "," +
                                  ((restricts) ? `'${restricts}'` : null) + "," +
                                  ((weapClass) ? `'${weapClass}'` : null) + "," +
                                  ((matClass) ? `'${matClass}'` : null) + "," +
                                  ((material) ? `'${material}'` : null) + "," +
                                  ((itemValue) ? `'${itemValue}'` : null) + "," +
                                  ((extra) ? `'${extra}'` : null) + "," +
                                  ((immune) ? `'${immune}'` : null) + "," +
                                  ((effects) ? `'${effects}'` : null) + "," +
                                  ((weight) ? weight : null) + "," +
                                  ((capacity) ? capacity : null) + "," +
                                  ((itemLevel) ? `'${itemLevel}'` : null) + "," +
                                  ((containerSize) ? containerSize : null) + "," +
                                  ((charges) ? charges : null) + "," +
                                  ((speed) ? speed : null) + "," +
                                  ((accuracy) ? accuracy : null) + "," +
                                  ((power) ? power : null) + "," +
                                  ((damage) ? `'${damage}'` : null) + ")" );


    console.log("[TEST]sqlStr: "+sqlStr);
    /*
	connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows.length >= 0) {
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${submitter.padEnd(30)} insert/update '${objName}'` );
          //console.log (`${submitter} SUCCESS update/insert '${objName}'`);
          //return callback(rows[0][0].LoreCount);
          return;
        }
        else {
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${submitter.padEnd(30)} insert/update '${objName}'` );
          //return callback(rows[0][0].LoreCount);
          return;
        }
      }
      else {
        console.log(err);
      }
    });
	*/
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });   //end of pool.getConnection() callback function
};  //END of CreateUpdateLore function
var parseLore = (pAuthor , pLore) => {
  let affects = null, objName = null, tmpStr = null;
  let attribName = null,attribName2 = null,attribValue2 = null,attribValue = null,attribValueX = null;
  let itemType = null,matClass = null,material = null,weight = null,value = null,speed = null, power = null
               ,accuracy = null,effects = null,itemIs  = null,charges = null, containerSize = null, capacity = null;
  let spell = null; // level
  let restricts = null,immune = null,apply = null,weapClass = null,damage = null;
  let extra = null;// ##################### NOT YET CODED OUT ##############################
  let isUpdateSuccess = false;
  let hasBlankLine = false;
  let match = null;
  let splitArr = [];
  let is2part = false;
  let attribRegex = /^([A-Z][0-9A-Za-z\s]+)\:(.+)$/;   //do not use /g here or matching issues
  let objRegex = /^Object\s'(.+)'$/;  //removed g flag
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  //The behavior associated with the 'g' flag is different when the .exec() method is used.
  //console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : pLore[0]: ${pLore.trim().split("\n")[0].trim()}`);

  // need to still do regex text in case of: https://github.com/longhorn09/lorebot/issues/9

  if (objRegex.test(pLore.trim().split("\n")[0].trim())) {
    //console.log(`matched: ${pLore.trim().split("\n")[0].trim()}`);
    match = objRegex.exec(pLore.trim().split("\n")[0].trim());
    objName = match[1];

    //we don't need to start loop at item[0] because we already matched the Object name in row[0]
    splitArr = pLore.trim().split("\n");
    for (let i = 1; i < splitArr.length; i++)
    {
      //make sure to reset capture variables to null each loop
      attribName = null, attribValue = null,
      attribName2 = null, attribValue2 = null;
	  attribValueX = null;
      match = null;
      is2part = false;

		// Level 27 : word of recall

      if (attribRegex.test(splitArr[i].toString().trim()) === true) {
        match = attribRegex.exec(splitArr[i].toString().trim());
        if (match !== null)
        {
          attribName = match[1].trim();
          if (match[2].trim().indexOf(":")>0)
          {
            if (/^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.test(match[2].trim())) //natural    Material:organic
            {
              is2part = true;
              match = /^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.exec(match[2].trim()); //Make sure regex.exec() exactly matches regex.test() stmt 4 lines above
              attribValue = match[1].trim();
              attribName2 = match[2].trim();
              attribValue2 = match[3].trim();
            }
            else {
              //console.log(`No match on 2nd half: ${match[2].trim()}`);  // this shouldn't happen
            }
          }
          else {    // 1-parter
            attribValue = match[2].trim();
          }

		  let levelRegex = /^Level\s(\d+)$/;
		  if (levelRegex.test(attribName.trim())) {
			let levelnumber = levelRegex.exec(attribName.trim());
			attribName = "level";
			attribValueX = levelnumber[1] + " : " + attribValue;
		  }

          switch(attribName.toLowerCase().trim()){
            case "item type":
              itemType = attribValue;
              break;
            case "contains":
              containerSize = /^(\d+)$/g.test(attribValue)  ? Number.parseInt(attribValue.trim()) : null;
              break;
            case "capacity":
              capacity = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "mat class":
              matClass = attribValue;
              break;
            case "material":
              material = attribValue;
              break;
            case "weight":
              weight = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue) : null;
              break;
            case "value":
              value  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "speed":
              speed  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "power":
              power  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "accuracy":
              accuracy  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "effects":
              effects = attribValue;
              break;
            case "item is":
              itemIs = attribValue;
              break;
            case "charges":
              charges  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "level":
              spell = attribValueX;    //varchar(80)
              break;
            case "restricts":
              restricts = attribValue;
              break;
            case "immune":
              immune = attribValue;
              break;
            case "apply":
              apply  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "class":      ///// weapon class?
              weapClass = attribValue;
              break;
            case "damage":
              damage = attribValue;
              break;
            case "affects":
              if (affects === null) {
                affects = attribValue + ",";
              }
              else {
                affects += attribValue + ",";
              }
              break;
          } //end of 1-parter

          if (attribName2 !== null && attribValue2 !== null) { //2-parter
            switch(attribName2.toLowerCase().trim()) {
              case "item type":
                itemType = attribValue2.trim();
                break;
              case "contains":
                containerSize  = /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "capacity":
                capacity  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "mat class":
                matClass = attribValue2.trim();
                break;
              case "material":
                material = attribValue2.trim();
                break;
              case "weight":
                weight  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "value":
                value  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;    //varchar(10)
                break;
              case "speed":
                speed =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "power":
                power =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "accuracy":
                accuracy  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "effects":
                effects = attribValue2.trim();
                break;
              case "item is":
                itemIs = attribValue2.trim();
                break;
              case "charges":
                charges  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "level":
                spell = attribValue2.trim();
                break;
              case "restricts":
                restricts = attribValue2.trim();
                break;
              case "immune":
                immune = attribValue2.trim();
                break;
              case "apply":
                apply  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "class":      ///// weapon class?
                weapClass = attribValue2.trim();
                break;
              case "damage":
                damage = attribValue2.trim();
                break;
              case "affects":
                if (affects === null) {
                    affects = attribValue2.trim() + ",";
                }
                else {
                  affects +=  attribValue2.trim() + ",";
                }

                break;
            }   //end of 2-parter
          //console.log(`[${i}]: ${attribName}: ${attribValue} , ${attribName2}: ${attribValue2}`);
          } //2-parter null test
        } //end if match[1] !== null
        else{ //usually empty line, but may be Extra to be captured here
          console.log(`splitArr[${i}] no match: ${splitArr[i].trim()}`);
        }
      }   //end if regex.test on first pattern match
    } //end of for loop
  } //end of objRegex.test()
  else {
    console.log(`no match in parseLore(): ${pLore.trim().split("\n")[0].trim()}`);
  }

  //just a check to make sure there's something new to update and not Object '' on a single line

  if (itemType !== null || matClass !== null || material !== null || weight !== null || value !== null
        || speed !== null || power !== null || accuracy !== null || effects !== null || itemIs !== null
        || charges !== null || spell !== null || restricts !== null || immune !== null  || apply !== null
        || weapClass !== null || damage !== null || affects !== null || containerSize !== null || capacity !== null)
  {
    // Do not comment the below out, the trimming of trailing comma is necessary and not just for debug purposes
    if (affects   != null) {
        affects = affects.substring(0,affects.length-1); //cull the trailing comma
    }

    // lore matched and attributes and key values captured
    // so initiate db create/update process via sp call of CreateLore
    let rowsAffected = 0;
	console.log("[TEST] would have attempted to create/update a lore");
	console.log("[TEST] weight: "+weight+" |value: "+value);
    CreateUpdateLore(objName,itemType,itemIs,pAuthor,affects,apply,restricts,weapClass,matClass,material,
                    value,extra,immune,effects,weight,capacity,spell,containerSize,charges,speed,accuracy,power,damage, (arg) => {
                      rowsAffected = arg;
                      console.log(`** in CreateUpdateLore callback ${rowsAffected}`);
                    });


  }  //end test if attributes are all null
} //end of function parseLore
//# Converts comma separated
var formatAffects = (pArg) => {
  let retvalue = "";
  let affectsArr = [];
  let sb = "";
  //let affectBy = /([A-Za-z_\s]+)\s*by\s*([-+]?\d+)/;
  let affectBy = /^([A-Za-z_\s]+)\s*by\s*(.+)$/;
  let match = null;

  affectsArr = pArg.trim().split(",");
  for (let i = 0;i<affectsArr.length;i++){
    if (affectBy.test(affectsArr[i].toString().trim()) )
    {
      match = affectBy.exec(affectsArr[i].toString().trim());
      //console.log("matched: " + affectsArr[i]);
      //console.log(match[1].toUpperCase().padEnd(14) + "by " + match[2]);
      if (match[1].trim() === "casting level" ||
          match[1].trim() === "spell slots" ) //keep these lower case
      {
          sb += "Affects".padEnd(9) + ": " + match[1].trim().padEnd(14) + "by " + match[2] + "\n";
      }
      else if (match[1].trim().toLowerCase().startsWith("skill ")) {  // lore formatting for skills
          sb += "Affects".padEnd(9) + ": " + match[1].trim().toLowerCase().padEnd(20) + "by " + match[2] + "\n";
      }
      else if (match[1].trim().length >= 13) {
        sb += "Affects".padEnd(9) + ": " + match[1].trim().toLowerCase() + " by  " + match[2] + "\n"; // note: 2 trailing spaces after by
      }
      else {
        sb += "Affects".padEnd(9) + ": " + match[1].trim().toUpperCase().padEnd(14) + "by " + match[2] + "\n";
      }
    }
    else {
      //console.log("didn't match: " + affectsArr[i]);       //this is going to be single lines like : regeneration 14%
      sb += "Affects".padEnd(9) + ": " + affectsArr[i].toString().trim() + "\n";
    }
  }
  retvalue = sb;
  return retvalue;
}
var formatLore = (pMsg,pRows) => {
  let sb = "";
  for (let i = 0; i < Math.min(pRows.length,MAX_ITEMS);i++){
    sb = "";
    sb += `\nObject '${pRows[i].OBJECT_NAME}'\n`;

    if (pRows[i].ITEM_TYPE != null) sb += `Item Type: ${pRows[i].ITEM_TYPE}\n`;
    if (pRows[i].MAT_CLASS != null) sb += `Mat Class: ${(pRows[i].MAT_CLASS).padEnd(13)}Material : ${pRows[i].MATERIAL}\n`;
    if (pRows[i].WEIGHT    != null) sb += `Weight   : ${(pRows[i].WEIGHT.toString()).padEnd(13)}Value    : ${pRows[i].ITEM_VALUE}\n`;
    if (pRows[i].AFFECTS   != null) sb += `${formatAffects(pRows[i].AFFECTS)}`;
    if (pRows[i].SPEED     != null) sb += `Speed    : ${pRows[i].SPEED}\n`;
    if (pRows[i].POWER     != null) sb += `Power    : ${pRows[i].POWER}\n`;
    if (pRows[i].ACCURACY  != null) sb += `Accuracy : ${pRows[i].ACCURACY}\n`;
    if (pRows[i].EFFECTS   != null) sb += `Effects  : ${pRows[i].EFFECTS}\n`;
    if (pRows[i].ITEM_IS   != null) sb += `Item is  : ${pRows[i].ITEM_IS.toUpperCase()}\n`;
    if (pRows[i].CHARGES   != null) sb += `Charges  : ${pRows[i].CHARGES}\n`;
    if (pRows[i].ITEM_LEVEL!= null) sb += `Level    : ${pRows[i].ITEM_LEVEL}\n`;
    if (pRows[i].RESTRICTS != null) sb += `Restricts: ${pRows[i].RESTRICTS.toUpperCase()}\n`;
    if (pRows[i].IMMUNE    != null) sb += `Immune   : ${pRows[i].IMMUNE}\n`;
    if (pRows[i].APPLY     != null) sb += `Apply    : ${pRows[i].APPLY}\n`;
    if (pRows[i].CLASS     != null) sb += `Class    : ${pRows[i].CLASS}\n`;
    if (pRows[i].DAMAGE    != null) sb +=        `Damage   : ${pRows[i].DAMAGE}\n`;
    if (pRows[i].CONTAINER_SIZE   != null) sb += `Contains : ${pRows[i].CONTAINER_SIZE}\n`;
    if (pRows[i].CAPACITY    != null) sb +=      `Capacity : ${pRows[i].CAPACITY}\n`;

    if (pRows[i].SUBMITTER != null) sb += `Submitter: ${pRows[i].SUBMITTER} (${pRows[i].CREATE_DATE})\n`;

    if (pMsg.channel != null && pMsg.channel.name === config.channel)
    {
      pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
        console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in formatLore(): ${err}`);
      });
    }
    else {
      pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
        console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in formatLore(): ${err}`);
      });
    }
    //pMsg.author.send( sb, {code: true});
  }
  return sb;
};
var formatBrief = (pMsg,pRows) => {
  let sb = "";
  for (let i = 0; i < Math.min(pRows.length,BRIEF_LIMIT);i++){
    //sb = "";
    sb += `\nObject '${pRows[i].OBJECT_NAME}'`;
    //console.log("```" + sb + "```");
  }
  pMsg.author.send(sb,{code:true});
  return sb;
};
// **********************
// *** END OF LoreBot ***
// **********************

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  // client.user.setGame(`on ${client.guilds.size} servers`);
  client.user.setPresence({ game: { name: 'ArcticMUD [+help]' }, status: 'Online' });
});

client.on("guildMemberAdd", member => {
	// This event triggers when a new member joins the guild(server)
	
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild(server).
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setPresence({ game: { name: 'ArcticMUD [+help]' }, status: 'Online' });
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild(server).
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setPresence({ game: { name: 'ArcticMUD [+help]' }, status: 'Online' });
});

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot && message.author.username != "CoDer") return;
  
  // LOREBOT STUFF
  if (     message.content.trim().indexOf("Object '") >= 0   //need to do this way because lore might be pasted in middle of conversation
        && message.author.username.substring(0,"lorebot".length).toLowerCase() !== "lorebot") {
    let loreArr = null, cleanArr = [];
    //need to scrub the lore message for processing
    loreArr = message.content.trim().split("Object '");
    for (let i = 0 ; i < loreArr.length; i++)  {
      if (loreArr[i].indexOf("'") > 0 && loreArr[i].indexOf(":"))
      {
        //console.log(`loreArr[${i}]: ${loreArr[i]}`);
        //cleanArr.push(`Object '${loreArr[i].trim()}`);
      }
    }
    for (let i = 0 ;i < cleanArr.length;i++) {
        //console.log(`cleanArr[${i}]: ${cleanArr[i]}`);
        //parseLore(message.author.username,cleanArr[i]);
    }
    loreArr = null;   //freeup for gc()
    cleanArr = null;  //freeup for gc()
  }
  // END OF LOREBOT STUFF
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;

	// set authorized variable - used to block commands
	var authorized = false;
	var admin = false;
	if (checkAdminRights(message)) { authorized = true; }
	authorized = false;
	if(message.author.username == "ColoradoDerek") {authorized = true;admin = true;console.log("[ADMIN] Admin user acknowledged");}
  
	// un-comment next line to disable bot for everyone except authorized users and higher
	//if(checkAdminRights(message) == false) return;
  
	// Let's determine if this is a DM
	var messageGuild = message.guild;
	var messageChannel = message.channel.name;
	var isDM = false;
	if (messageGuild === null) {isDM = true;}
	console.log("[SYSTEM MESSAGE]Message Detected: yes  From: "+message.author.username+"  DM: "+isDM+"  Server: "+messageGuild+"  Channel: "+messageChannel);
	console.log("[SYSTEM MESSAGE]Message: "+message);
	
	//Message Detected: yes  From: pastawhee  DM: false  Server: The High Council  Channel: arctic-mud
	// This keeps the bot from talking to outsiders
	//if (!isDM) {if (messageGuild != "THC-NEW") return;}
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  
	// the .replace() in the next line is to help prevent "sql injection" issues
	const args = message.content.slice(config.prefix.length).trim().replace(/\'/g,"").split(/ +/g);
	var brief = false;
	for (let i=0;i<args.length;i++) {if (args[i] == "brief") {brief = true;}}
	const command = args.shift().toLowerCase();
	
	// Tracking the people who use me
	if (Last5Users.length == 15) {
		Last5Users.shift();
		let z = '';
		if (args.length > 0) {z = args.join(" ");}
		else {z = "<no args>";}
		let times = returnTimeStamp();
		let Last5Time = times[0];
		Last5Users.push("["+Last5Time+"] **"+message.author.username+"**: `+"+command+"` `"+z+"`");	
	} else {
		let z = '';
		if (args.length > 0) {z = args.join(" ");}
		else {z = "<no args>";}
		let times = returnTimeStamp();
		let Last5Time = times[0];
		Last5Users.push("["+Last5Time+"] **"+message.author.username+"**: `+"+command+"`  `"+z+"`"); 
	}

	// Process the Command
	if (ValidCommands.includes(command)) {
		if(command === "ping") {
			// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
			// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
			const m = await message.channel.send("Ping?");
			m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
			message.author.send("pong!");
		} else 

		// Spells section (disabled)
		if((command === "spells" || command === "spell" || command === "sp") && authorized && admin) {
			if (debug) {console.log("[SPELLS]Processing");}
			let noEdit = false;
			let arg0 = '';
			let msg = await message.author.send("One sec while I look that up...");
			if (args.length > 0) {
				let m = 0;
				let od = "";
				arg0 = args[0];
				let clas = arg0.trim().toLowerCase();
				if (clas == "cler" || clas == "cl" || clas == "c") {clas = "cleric";}
				if (clas == "dru" || clas == "dr") {clas = "druid";}
				if (clas == "sha" || clas == "sh" || clas == "sham") {clas = "shaman";}
				
				// +spells druid  lands you here
				if (ClassArray.indexOf(clas) != -1 &&  args[1] == null) {
					sqlStr = "SELECT * FROM spells WHERE class = '"+clas+"' ORDER BY spellname ASC";
					try {
						runQuery(sqlStr, function(rows) {
							if (rows.length > 0) {
								od += "```asciidoc\n["+ucFirstAllWords(clas)+" Spell List]```\n";
								for (let i=0;i<rows.length;i++) {
									// This will cycle through each spell entry
									
									// reset the m variable
									m = 0;
									
									// Make sure the message stays under 2000 per send
									if (od.length > 1700) {
										if (noEdit) {message.author.send(od);od="";}
										else {msg.edit(od);od="";noEdit = true;}											
									}
									
									// ********************************
									// Get the zones the spell loads in
									// ********************************
									raw_zones = rows[i].zone;
									let zones = [];
									if (raw_zones.indexOf(',') > -1) {
										zones = raw_zones.split(',');
									}
									else {zones[0] = raw_zones;}
									
									// ********************************
									// Get the mobs the spell loads on
									// ********************************
									raw_mobs = rows[i].mobs;
									let mobs = [];
									if (raw_mobs.indexOf(':') > -1) {
										mobs = raw_mobs.split(':');
									}
									else {mobs[0] = raw_mobs;}
									
									// We have the Mobs (mobs[]) and Zones (zones[])
									// We have the spell name (rows[].spellname)
									// We have the name of the book/charm/tablet(s) it loads in
									
									// Shaman (Spell Name) (Charm Name) then \t (zone name) on (mob name)
									// Druid  (Spell Name) (Tier #) then \t (zone name) on (mob name)
									//		need to add the druid tier list to the +spells command
									//		Tier list would be book names per tier, or spells per tier
									//		should likely build a seperate table for this
									// Cleric (Spell Name) (Tier #) then \t (zone name) on (mob name)
									//		need to add the cleric tier list to the +spells command
									// Mage (Spell Name) (Book Name) then \t (zone name) on (mob name)
									//		could add basic info like, +spells bookname to see spells for that book and where they load
									
									if (zones.length == 1) {
										// Only 1 zone, mostly used by shamans, mages and some other unique spells
										try {
											getLongName(zones[0], function(data) {
												if (clas == "shaman" || clas == "cleric") {
													od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+rows[i].bookname+"*)\n";
												} else if (clas == "druid") {
													od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+ucFirstAllWords(rows[i].tier)+"*)\n";
												}
												od += "\t**"+ucFirstAllWords(data)+"**  on  **"+ucFirstAllWords(mobs[0])+"**\n\n";
											});
										}
										catch(err) {
											console.log("[SPELLS]Error Caught: "+err);
										}
									} else if (zones.length > 1) {
										if (clas == "shaman" || clas == "cleric") {
											od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+rows[i].bookname+"*)\n";
										} else if (clas == "druid") {
											od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+ucFirstAllWords(rows[i].tier)+"*)\n";
										}
										try {
											getLongName(raw_zones, function(data) {
												od += "\t**"+ucFirstAllWords(data)+"**  on  **"+ucFirstAllWords(mobs[m])+"**\n";
												if ((m) == (zones.length-1)) {od += "\n";}
												m++;
											});
										}
										catch(err) {
											console.log("[SPELLS]Error Caught: "+err);
										}
									} else {			}	
								}
								if (noEdit) {message.author.send(od);}
								else {msg.edit(od);}
							} else {
								msg.edit("No spells found.");
							}
						},args,message,command);
					}
					catch(err) {
						console.log("[SPELLS]Error Caught: "+err);
					}
				} else if (args[1] != null) {
					// Processing 2+ arguments here
					let arg1 = args[1].trim().toLowerCase();
					//for (let i=0;i<args.length;i++) {console.log("args["+i+"]:"+args[i]);}
					
					// "+spells name <filter>" command lands you here
					if (arg0 == "name") {
						if (arg1 == null || arg1 == '') { msg.edit("Invalid.  Spell.  Name."); }
						else {
							var spell_name = '';
							for (let i=1;i<args.length;i++) {
								spell_name += args[i];
								if (i < args.length-1) {spell_name += ' ';}
							}
							msg.edit("You are after a single spell named: **"+spell_name+"**");
							sqlStr = "SELECT * FROM spells WHERE spellname LIKE '%"+spell_name+"%' ORDER BY spellname ASC";
							try {
								runQuery(sqlStr, function(rows) {
									if (rows.length > 0) {
										message.author.send("-----------------------------------------------------------------\nAbove is a list of spells whose name is similar to `"+spell_name+"`\n**Requested by**: "+message.author.username);
										for (let i=0;i<rows.length;i++) {
											let m = 0;												
											let clas = rows[i].class;
											
											// ********************************
											// Get the zones the spell loads in
											// ********************************
											raw_zones = rows[i].zone;
											let zones = [];
											if (raw_zones.indexOf(',') > -1) {zones = raw_zones.split(',');}
											else {zones[0] = raw_zones;}
											
											// ********************************
											// Get the mobs the spell loads on
											// ********************************
											raw_mobs = rows[i].mobs;
											let mobs = [];
											if (raw_mobs.indexOf(':') > -1) {mobs = raw_mobs.split(':');}
											else {mobs[0] = raw_mobs;}
											
											if (zones.length == 1) {
												// Only 1 zone, mostly used by shamans, mages and some other unique spells
												try {
													getLongName(zones[0], function(data) {
														if (clas == "shaman" || clas == "cleric") {
															od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+rows[i].bookname+"*) ("+clas+")\n";
														} else if (clas == "druid") {
															od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+ucFirstAllWords(rows[i].tier)+"*) ("+clas+")\n";
														}
														od += "\t**"+ucFirstAllWords(data)+"**  on  **"+ucFirstAllWords(mobs[0])+"**\n\n";
													});
												}
												catch(err) {
													console.log("[SPELLS]Error Caught: "+err);
												}
											} else if (zones.length > 1) {
												if (clas == "shaman" || clas == "cleric") {
													od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+rows[i].bookname+"*) ("+clas+")\n";
												} else if (clas == "druid") {
													od += "**"+ucFirstAllWords(rows[i].spellname)+"** (*"+ucFirstAllWords(rows[i].tier)+"*) ("+clas+")\n";
												}
												try {
													getLongName(raw_zones, function(data) {
														od += "\t**"+ucFirstAllWords(data)+"**  on  **"+ucFirstAllWords(mobs[m])+"**\n";
														console.log("m:"+m+" |data:"+data);
														if ((m) == (zones.length-1)) {od += "\n";}
														m++;
													});
												}
												catch(err) {
													console.log("[SPELLS]Error Caught: "+err);
												}
											} else {
												console.log("[ERROR]zones.length = "+zones.length);
											}
											msg.edit(od);
										}
									} else {msg.edit("What spell?");}
								});
							}
							catch(err) {
								console.log("[SPELLS]Error Caught: "+err);
							}
						}
					} else if (ClassArray.indexOf(arg0) != -1 && arg1 == "list") {
						// +spells druid list lands you here
						msg.edit("You are looking for a **complete spell list** for a **"+ucFirstAllWords(clas)+"** but I do not have those ready yet.");
					} else {
						// all other 2 argument commands that don't match anything lands you here
						if (ClassArray.indexOf(arg0) != -1) {msg.edit("Unknown command '"+arg1+"'.");}
						else {msg.edit("Unknown command '"+arg0+" "+arg1+"'.");}
						message.author.send(showSpellsHelp());
					}
				} else {
					// single argument commands that don't match land you here
					let showunk = true;
					if (arg0 == "name") {msg.edit("Missing the spell name. +spells name <partial spell name>");showunk = false;}
					if (arg0 == "help") {showunk = false;}
					if (showunk) {msg.edit("Unknown command '"+arg0+"'.");}
					message.author.send(showSpellsHelp());
				}
			} else {
				// no arguments lands you here
				msg.edit(showSpellsHelp());
			}
		} else
		
		// Rank Mob section (disabled)
		// Possible format update, but pretty good atm
		if(command === "rm" && (message.author.username == "CoDer" || message.author.username == "-Wyndz-" || message.author.username == "DTeam") && authorized && admin) {
			// if args == 1, check for zone, if no zone, check mob name in rank db, if no, add, if yes, say its already there
			// if args == 2, check mob name in rank db, if no, add it and the zone, if yes, update it and say it was updated
			let rm_raw = message.content.slice(config.prefix.length + 2).trim();
			
			if (args.length > 0) {
				if (args.length == 1) {
					try {
						DoesZoneExist(args[0], message, function(zo) {
							if (typeof zo === "object" ) { //&& args.length > 50000000
								// a zone name was likely entered - show all mobs for that zone
															
								pool.getConnection((err,connection)=>{
									if (err) {
										connection.release();
										console.log({"code":100,"status":"Error in db connection in pool.getConnect(callback)"});
									} else {
										let zoneLN = zo['longname'].replace(/'/g,"\\'");
										sqlStr = "SELECT * FROM rankmobs WHERE zone like '"+zoneLN+"'";
										if (debug) {console.log("[rm]sqlStr: "+sqlStr);}
										connection.query(sqlStr,(err,rows) => {
											if (!err) {
												connection.release();
												od  = "";
												od += "```css\n";
												od += "***********************************\n";
												od += "Rank Mobs: ["+ucFirstAllWords(zo['longname'])+"]\n";
												od += "-----------------------------------\n";
												for (let i=0;i<rows.length;i++) {
													od += " "+rows[i].mob+"\n";
												}
												if (rows.length == 0) {od+= " No rank mobs found\n";}
												od += "***********************************\n";
												od += "```";
												message.channel.send(od);
											} else {
												// SQL Failed
											}
										});
									}
								});													
							} else {
								// args[0] was not a zone, treat entire entry as the mob name
								// Processes messages from CoDer or Wyndz
								// rm should now be able to insert into SQL
								let rm = rm_raw.replace(/'/g,"\\'");
								try {
									processRankMob(rm, message)
								}
								catch(err) {
									console.log("[RM]Error Caught: "+err);
								}
							}
						},args,command);
					}
					catch(err) {
						console.log("[RM]Error Caught: "+err);
					}
				} else 
				if (args.length > 1) {
					// Process Messages from CoDer or Wyndz
					// rm should now be able to insert into SQL
					let rm = rm_raw.replace(/'/g,"\\'");
					try {
						processRankMob(rm, message)
					}
					catch(err) {
						console.log("[RM]Error Caught: "+err);
					}
				}
			}
		} else
			
		// Pretty Solid ATM (disabled)
		if(command === "sendlog" && authorized) {
			if (args.length >= 1) {
				let zone = args[0];
				if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[SENDLOG]Error Caught: "+err);}}
				try {
					DoesZoneExist(zone, message, function(zo) {
						if (typeof zo === "object") {
							let logfile = "logs/"+zo['logfile'];
							if (zo['logfile'] !== null && zo['logfile'] != "") {
								//message.author.send("Requested Log File: "+ucFirstAllWords(zo['longname']), {files: [logfile]});
								message.author.send("This feature is currently disabled, sorry!");
							} else {
								message.author.send("No log file found for zone: "+ucFirstAllWords(zo['longname']));
							}
						} else {
							// Process Error Codes
							// Zone doesn't exist
							if (debug) {console.log("[SENDLOG]zo :"+zo);}
							if (zo == "err") {
								// There was an error, shouldn't happen often
								zo = "";
								message.author.send("There was an error.");
								Error("[SENDLOG]zo = err", args, message, command);
							} else if (zo == "no") {
								// Start zone not found
								zo = "";
								message.author.send("Zone not found.");
							} else if (zo == "twoplus") {
								// More than 1 Start zone found - shouldn't happen
								zo = "";
								message.author.send("More than 1 Zone found. Cannot send a log.");
								Error("[SENDLOG]2+ zones", args, message, command);
							}
						}
					},args,command);
				}
				catch(err) {
					console.log("[SENDLOG]Error Caught: "+err);
				}
			} else {message.author.send(showSendlogHelp());}
		} else
			
		if(command === "tsf" && authorized) {
			//message.channel.send("Test Sending a file").MessageAttachment.filename("C:\dev\test.txt");
			//message.channel.sendFile("C:\dev\test.txt", null).queue(message -> {message.editMessage("Test Sending a File").queue() });
			//message.channel.send("Testing Sending a File", {files: ["logs/Bandit_Swamp.txt"]});
		} else

		// Pretty Solid ATM
		if((command === "zoneinfo" || command === "zi" || command === "zonei") && authorized) {
			if (args[0] != null) {
				let zone = args[0];
				let emoji = ":flag_white:";
				if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[ZONEINFO]Error Caught: "+err);}}
				try {
					DoesZoneExist(zone, message, function(zo) {
						if (typeof zo === "object") {
							let od  = "";
							od += "**Zone Info** for **"+ucFirstAllWords(addEmojis(zo['longname']))+"**\n";
							od += "\t**ShortName** : `"+zo['shortname']+"`     ";
							if (zo['alignment'] == "evil") {emoji = ":smiling_imp:";}
							else if (zo['alignment'] == "good") {emoji = ":angel:";}
							od += "\t**Alignment** : "+emoji+"\n"; // **"+zo['alignment']+"**\n";
							
							try {
								getDirectionsList(zo['shortname'], function(dirs) {
									if (dirs != "err") {
										
										if (dirs[1] != "") {
											od += "\t**Directions to   `"+ucFirstAllWords(zo['longname'])+"`**:\n";
											let tz = dirs[1].split(",");
											od+="```\n";
											for (let i=0;i<tz.length;i++) {
												od += createSpace(tz[i],7)+"  |  +dirs "+tz[i].trim()+" "+zo['shortname'].trim()+"\n";
											}
											od+="```";
										} else {od += "\t**Directions to   `"+ucFirstAllWords(zo['longname'])+"`**: None Found\n";}
										
										if (dirs[0] != "") {
											od += "\t**Directions from   `"+ucFirstAllWords(zo['longname'])+"`**:\n";
											let fz = dirs[0].split(",");
											od+="```\n";
											for (let i=0;i<fz.length;i++) {
												od += createSpace(fz[i],7)+"  |  +dirs "+zo['shortname'].trim()+" "+fz[i].trim()+"\n";
											}
											od+="```";
										} else {od += "\t**Directions from   `"+ucFirstAllWords(zo['longname'])+"`**: None Found\n";}
										
										od += "\t**LocateSpot** : ";
										if (zo['locatespot'] !== null && zo['locatespot'] !== "") {od += "`"+zo['locatespot']+"`     ";}
										else {od += ":question:     ";}
										
										od += "\t**LogFile** : `";
										if (zo['logfile'] !== null && zo['logfile'] !== "") {od += "YES`\n";} 
										else {od += "NO`\n";}
										
										message.author.send(od);
									} else {Error("[GDL]Error: "+dirs, args, message, command);}
								});
							}
							catch(err) {
								console.log("[ZONEINFO]Error Caught: "+err);
							}
							
						} else {
							// Process Error Codes
							// Zone doesn't exist
							if (zo == "err") {
								// There was an error, shouldn't happen often
								zo = "";
								message.author.send("There was an error.");
								Error("[ZONEINFO]zo = err", args, message, command);
							} else if (zo == "no") {
								// Start zone not found
								zo = "";
								if (debug) {console.log("[ZONEINFO]Zone '"+zone+"' was not found.");}
								message.author.send("Zone '"+zone+"' was not found.");
							} else if (zo == "twoplus") {
								// More than 1 Start zone found - shouldn't happen
								zo = "";
								message.author.send("There was an error.");
								Error("[ZONEINFO]2+ zones", args, message, command);
							}
						}
					},args,command);
				}
				catch(err) {
					console.log("[ZONEINFO]Error Caught: "+err);
				}
			} else {
				// no arguments with command
				message.author.send(showZoneinfoHelp());
			}
		} else 
		
		// Pretty Solid atm
		if(command === "zones" || command === "zone") {
			let showhelp = false;
			let bypasstier = false;
			let bypassarea = false;
			let bypassalign = false;
			let alignment = false;
			let noEdit = false;
			let sqlStr = "";

			let sqlStrStart = "SELECT * FROM zones";
			let sqlStrEnd = " ORDER BY longname ASC";
			let sqlStrMiddle = "";

			let areasearch = false;
			let tiersearch = false;
			let alignsearch = false;
			if (args.length > 1) {
				// +zones area <area> lands here
				if (args[0].toLowerCase() == "area" && (args.length == 2 || args.length == 3)) {
					if (args.length == 2) {
						let areaexists = AvailableAreas.includes(args[1]);
						if (areaexists) {
							sqlStr = "SELECT * FROM zones WHERE arealocatedin LIKE '%" + args[1] + "%' ORDER BY longname ASC";
							sqlStrMiddle += " WHERE arealocatedin LIKE '%" + args[1] + "%'";
							areasearch = true;
						} else {
							showhelp = true;
							bypassarea = true;
						}
					// alignment search by area lands here
					// +zones area <area> <alignment>
					} else if (args.length == 3) {
						let areaexists = AvailableAreas.includes(args[1]);
						if (areaexists) {
							if (args[2] == "evil" || args[2] == "good" || args[2] == "neutral") {
								sqlStr = "SELECT * FROM zones WHERE arealocatedin LIKE '%" + args[1] + "%' AND alignment = '" + args[2] + "' ORDER BY longname ASC";
								sqlStrMiddle += " WHERE arealocatedin LIKE '%" + args[1] + "%' AND alignment = '" + args[2] + "'";
								areasearch = true;
								alignsearch = true;
							} else {
								showhelp = true;
								bypassarea = true;
								alignment = true;
							}
						}
					}
				// +zones tier <number> lands here
				} else if (args[0].toLowerCase() == "tier" && (args.length == 2 || args.length == 3)) {
					// this checks for tier #
					if (isNaN(args[1])) {
						showhelp = true;
						try {argsIgnored(1,message,args);} catch(err){console.log("[ZONES]Error Caught: "+err);}
					} else {
						if (args[1] <= 5 && args[1] >= 0 && args.length == 2) {
							sqlStr = "SELECT * FROM zones WHERE tier = '" + args[1] + "' ORDER BY longname ASC";
							sqlStrMiddle += " WHERE tier = '" + args[1] + "'";
							tiersearch = true;
						} else {
							// +zones tier <number> <[evil|good|neutral]> lands here
							if (args[1] <= 5 && args[1] >= 0 &&
								args.length == 3 &&
								(args[2] == "evil" || args[2] == "good" || args[2] == "neutral")) {
								sqlStr = "SELECT * FROM zones WHERE tier = '" + args[1] + "' AND alignment = '" + args[2] + "' ORDER BY longname ASC";
								sqlStrMiddle += " WHERE tier = '" + args[1] + "' AND alignment = '" + args[2] + "'";
							} else {
								showhelp = true;
								bypasstier = true;
							}
						}
					}
				} else if (args[0].toLowerCase() == "alignment" && args.length == 2) {
					if (args[1] == "evil" || args[1] == "good" || args[1] == "neutral") {
						sqlStr = "SELECT * FROM zones WHERE alignment = '" + args[1] + "'";
						sqlStrMiddle += " WHERE alignment = '" + args[1] + "'";
						alignsearch = true;
					} else {
						alignsearch = true;
						showhelp = true;
						bypassalign = true;
					}
				} else {
					if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[ZONES]Error Caught: "+err);}}
					sqlStr = "SELECT * FROM zones WHERE longname LIKE '%" + args[0] + "%' OR shortname LIKE '%" + args[0] + "%' ORDER BY longname ASC";
					sqlStrMiddle += " WHERE longname LIKE '%" + args[0] + "%' OR shortname LIKE '%" + args[0] + "%'";
				}
			} else if (args.length == 1) {
				if (args[0] == "help") {showhelp = true;} 
				else {
					sqlStr = "SELECT * FROM zones WHERE longname LIKE '%" + args[0] + "%' OR shortname LIKE '%" + args[0] + "%' ORDER BY longname ASC";
					sqlStrMiddle += " WHERE longname LIKE '%" + args[0] + "%' OR shortname LIKE '%" + args[0] + "%'";
				}
			} else { sqlStr = "SELECT * FROM zones ORDER BY longname ASC"; }

			let testsqlStr = sqlStrStart + sqlStrMiddle + sqlStrEnd;
			console.log("[TEST]testsqlStr: " + testsqlStr);
			
			if (!showhelp) {
				try {
					console.log(sqlStr);
					runQuery(sqlStr, function(rows) {
						if (rows.length > 0) {
							od  = "";
							od += "**Arctic.lib** ---> Available Zones";
							if (areasearch) {
								od += " by Area `"+args[1]+"`";
								if (alignsearch) {od += " ("+ucFirstAllWords(args[2])+" Only)";}
							}
							if (tiersearch) {od += " by Tier `"+args[1]+"`";}
							od += "\n";
							//od += "---------------------------------\n";
							od += "```\n";
							od += "------- | ---------------------------- | ------\n";
							od += "-SHORT- | ------------LONG------------ | -TIER-\n";
							od += "------- | ---------------------------- | ------\n";
							for (let i=0;i<rows.length;i++) {
								// Make sure the message stays under 2000 per send
								if (od.length > 1700) {
									od += "```";
									message.author.send(od);
									od = "```\n";
								}
								od += createSpace(rows[i].shortname,7);
								od += " | ";
								od += createSpace(rows[i].longname,28);
								od += " | ";
								od += createSpace(rows[i].tier.toString(),6);
								od += "\n";
							}
							od += "```";
							message.author.send(od);
						} else {
							if (areasearch && alignsearch) {
								message.author.send("No `"+args[2].toUpperCase()+"` zones found around area `"+ucFirstAllWords(args[1])+"`");
							} else if (alignsearch) {
								message.author.send("No `"+args[1].toUpperCase()+"` zones found");
							} else { message.author.send("No Zones found matching `"+args[0]+"`"); }
						}
					}, args, message, command);
				}
				catch(err) {
					console.log("[ZONES]Error Caught: "+err);
				}
			} else {
				if (!bypasstier && !bypassarea && !bypassalign) {message.author.send(showZonesHelp());}
				else {
					if (bypasstier) {message.author.send("Tiers are between 0 and 5.");}
					if (bypassarea) {
						if (!alignment) {message.author.send("Area: `"+args[1]+"` is not a valid area.");}
						else {message.author.send("Alignment `"+ucFirstAllWords(args[2])+"` for the area `"+args[1].toUpperCase()+"` is not a valid alignment.");}
					}
					if (bypassalign) {message.author.send("Alignment `"+ucFirstAllWords(args[1])+"` is not a valid alignment");}
				}
			}
		} else 
			
		// Pretty Solid atm
		if(command === "locate" || command === "loc") {
			if (debug) {console.log("[LOCATE]Processing");}
			if (args.length > 0) {
				let zone = args[0];
				if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[LOCATE]Error Caught: "+err);}}
				//(z)one (o)bject
				try {
					DoesZoneExist(zone, message, function(zo) {
						if (typeof zo === "object") {
							// Zone Exists
							od  = "```md\n";
							od += " [Locate Info]["+createSpace(ucFirstAllWords(zo['longname']),40)+"]\n";
							if (zo['locatespot'] != null && zo['locatespot'] != '') {
								od += " [Locate Spot]["+createSpace(ucFirstAllWords(zo['locatespot']),40)+"]\n";
							} else {
								od += " [Locate Spot]["+createSpace("N/A",40)+"]\n";
							}				
							od += " [Locate Keywords]["+createSpace(" ",36)+"]\n";
							if (zo['locatekeywords'] != null && zo['locatekeywords'] != '') {
								let itemlist = zo['locatekeywords'].split(",");
								let locatelist = '';
								od += " <";
								for (let i=0;i<itemlist.length;i++) {
									if (i > 0) {locatelist += "\n  ";}
									locatelist += " "+itemlist[i];
								}
								od += locatelist;
								od += " >";
							} else {
								od += "\tNo Keywords Found\n";
							}
							od += "```";
							message.author.send(od);
						} else {
							// Process Error Codes
							// Zone not found
							if (zo == "err") {
								// There was an error, shouldn't happen often
								zo = "";
								message.author.send("There was an error.");
								Error("[LOCATE]zo = err",args,message, command);
							} else if (zo == "no") {
								// Start zone not found
								zo = "";
								console.log("[LOCATE]Zone '"+zone+"' not found.");
								message.author.send("Zone '"+zone+"' not found.");
							} else if (zo == "twoplus") {
								// More than 1 Start zone found - shouldn't happen
								zo = "";
								message.author.send("There was an error.");
								Error("[LOCATE]2+ zones",args,message, command);
							}
						}
					},args,command);
				}
				catch(err) {
					console.log("[LOCATE]Error Caught: "+err);
				}
			} else {
				message.author.send(showLocateHelp());
			}
		} else 

		// Pretty Solid atm
		if(command === "dirs" && authorized) {
			var GoToEnd = false;
			var StartZone = "";
			if (debug) {console.log("[DIRS]Processing");}
			
			// Process the args
			if (args.length >= 1) {
				StartZone = args[0].toLowerCase();
				try {
					DoesZoneExist(StartZone, message, function(sz) {   //  First CallBack
						//str = JSON.stringify(sz, null, 4); // (Optional) beautiful indented output.
						//console.log(str);
						//console.log("[DIRS]sz type: '"+typeof sz+"' |sz shortname: '"+sz['shortname']+"'");
						if (typeof sz != 'undefined') {
							if (sz == "err") {
								// There was an error, shouldn't happen often
								sz = "";
								message.author.send("There was an error.");
								Error("[DIRS]sz = err",args,message,command);
								GoToEnd = true;
							} else if (sz == "no") {
								// Start zone not found
								sz = "";
								if (args[0] == "help") {message.author.send(showDirsHelp());} 
								else {message.author.send("Zone '"+StartZone+"' not found.");}
								GoToEnd = true;
							} else if (sz == "twoplus") {
								// More than 1 Start zone found - shouldn't happen
								sz = "";
								message.author.send("There was an error.");
								Error("[DIRS]More than 1 start zone found.",args,message,command);
								GoToEnd = true;
							} else if (typeof sz != 'object') {
								message.author.send("There was an error.");
								Error("[DIRS]sz != obj",args,message,command);
							} else { /* sz = object */ }
						} else { 
							/* here if typeof sz == 'undefined' */
							GoToEnd = true;
							message.author.send("There was an error.");
							Error("[DIRS]sz = undefined",args,message, command);
						}
							
						// sz = object of StartZone at this point
						if (!GoToEnd) {
							if ( (args.length == 1/* && !brief*) || (args.length == 2 && brief*/ ) ) {
								// only 1 zone was sent
								message.author.send("+dirs needs 2 zones");
								message.author.send(showDirsHelp());
							} else if ( (args.length == 2 /*&& !brief*) || (args.length == 3 && brief*/ )) {
								// +dirs <start location> <end location>
								// shows directions from a to b
								EndZone =  args[1].toLowerCase();
								try {
									DoesZoneExist(EndZone,message,function(ez) {
										// Process ez Here
										//console.log("[DIRS]ez type: '"+typeof ez+"' |ez shortname: '"+ez['shortname']+"'");
										if (ez == "err") {
											// There was an error, shouldn't happen often
											ez = "";
											message.author.send("There was an error.");
											Error("[DIRS]ez = err",args,message, command);
											GoToEnd = true;
										} else if (ez == "no") {
											// Start zone not found
											ez = "";
											if (args[1] == "help") {message.author.send(showDirsHelp());} 
											else {message.author.send("Zone '"+EndZone+"' not found.");}
											GoToEnd = true;
										} else if (ez == "twoplus") {
											// More than 1 Start zone found - shouldn't happen
											ez = "";
											message.author.send("There was an error.");
											Error("[DIRS]More than 1 end zone found.",args,message, command);
											GoToEnd = true;
										} else if (typeof ez != 'object') {
											message.author.send("There was an error.");
											Error("[DIRS]ez != obj",args,message, command);
										}  else { /* ez is a zone object */ }
										
										//sz and ez should be set at this point, both zone objects
										if (sz != "" && typeof sz !== 'undefined' && ez != "" && typeof ez !== 'undefined' && !GoToEnd) {
											sqlStr = "SELECT * FROM directions WHERE startlocation = '"+sz['shortname']+"' AND endlocation = '"+ez['shortname']+"'";
											try {
												runQuery(sqlStr, function(rows) {
													if (rows.length == 1) {
														let Output = "Directions from **"+ucFirstAllWords(sz['longname'])+"** to **"+ucFirstAllWords(ez['longname'])+"**";
														Output += ":\n";
														Output += "Start Room : "+ucFirstAllWords(rows[0].startroom)+"\n";
														Output += "\t"+rows[0].dirs;
														message.author.send(Output);
													} else {
														if (rows.length == 0) {
															if (debug) {console.log("[DIRS]No dirs found");}
															message.author.send("Cannot find directions from **"+ucFirstAllWords(sz['longname'])+"** to '**"+ucFirstAllWords(ez['longname'])+"**'");
														} else {
															// Shouldn't get here
															message.author.send("There was an error.");
															Error("[DIRS]2+ result on dirs query",args,message, command);
														}
													}
												},args,message,command);
											}
											catch(err) {
												console.log("[DIRS]Error Caught: "+err);
											}
										} else {
											// Had args but they weren't recognized
											// Don't think this should happen often
											if (!GoToEnd) {
												message.author.send("There was an error.");
												Error("[DIRS]Something weird happened",args,message, command);
											}
											else {/* do nothing, BOT has already spoken! */}
										}		
									},args,command);
								}
								catch(err) {
									console.log("[DIRS]Error Caught: "+err);
								}
							} else {
								if (debug) {console.log("Whoops! We ended without giving any information!");}
								if (debug) {console.log("GoToEnd: "+GoToEnd+" -- args.length: "+args.length);}
								message.author.send("FOOM!!  You crashed me.  Sort of... I'm actually fine. No directions for you though...sheesh.");
								let x = "Command from: "+message.author.username+" caused +dirs to end with no output\n";
								for (let i=0;i<args.length;i++) {
									if (i != 0) {x += " ";}
									x += args[i];
								}
								SWM(x, args, message, command);						
							}
						} else { /* GoToEnd == true */ }
					},args,command);
				}
				catch(err) {
					console.log("[DIRS]Error Caught: "+err);
				}
			} else { 
				/* no args */
				message.author.send(showDirsHelp());
			}
	  } else 
	  
		if(command === "help") {
			let output = '';
			output += 'Use **shortname** where you need <zone> for best results\n';
			output += 'List of Available Commands: *(put a `+` before them)*\n';
			
			if (authorized) {
				output += '\t**dirs** <startzone> <endzone>\n';
				output += '\t\tdirections from <startzone> to <endzone>\n';
			}
			
			output += '\t**zones** <filter> *filter optional*\n';
			output += '\t\tUse this command to find the **shortname** of a zone\n';
			output += '\t\tShows a list of zones, `+zones help` for help\n';
			
			if (authorized) {
				output += '\t**zoneinfo** <zone> : lists info about <zone>\n';
				output += '\t\t`+zi` for help\n';
			}
			
			output += '\t**locate** <zone> : lists locate keywords/spot for <zone>\n';
			output += '\t\t`+loc` for help\n';
			output += '\t\t**hardly any information for **`+loc`** exists yet, help **`+update`** me!**\n';
			
			if (authorized) {
				output += '\t**sendlog** <zone> : Sends the log file by DM\n';
				output += '\t\t*Check `+zoneinfo` to see if a log file exists*\n';
			}
			
			if (authorized) {
				output += '\t**list** <option> : lists things\n';
				output += '\t\t`+li` for help\n';
			}
			
			output += '\t**legend** <class>\n';
			output += '\t\tgives Legend info for <class>\n';
			
			if (admin) {
				output += '\t**rm** <zone> : Shows the rank mobs for <zone>\n';
			}
			
			output += '\t**randomzone** <tier>\n';
			output += '\t\tPicks a random zone from the <tier> list for your group to run\n';
			output += '\t\t<tier> can be 1 - 5, `+rz` for help\n';
			
			if (admin) {
				output += '\t**spells** : Spell drop info\n';
				output += '\t\t`+spells` for help\n';
			}
			
			output += '\t**update** : Use this to help `+update` me!\n';
			output += '\t\tYour info will help update my available knowledge\n';
			
			output += '\t**idea** : Want something added? `+idea`!\n';
			
			output += '\t**stats** - shows my `+stats`\n';
			
			output += '\t**prep** <filter> : lists prep items `+prep help`\n';
			output += '\t\t<filter> can be one or more of the following:\n';
			output += '\t\timmune,ams,limdam,heal,cure,aoe,buff,ds,charmy,misc\n';
			message.author.send(output);
		} else 
	  
		if(command === "say" && authorized) {
			// makes the bot say something and delete the message. As an example, it's open to anyone to use. 
			// To get the "message" itself we join the `args` back into a string with spaces: 
			const sayMessage = args.join(" ");
			// Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
			message.delete().catch(O_o=>{}); 
			// And we get the bot to say the thing: 
			message.channel.send(sayMessage);
		} else
		  
		if(command === "test" && authorized) {
			console.log("[TEST]Processing");
			if (checkAdminRights(message)) {
				try {
					//testEmbed(message);
					temphalf1 = "skill gaze    ";
					half1 = temphalf1.trim();
					temphalf2 = "+10";
					half2 = temphalf2.replace(/\+/g, '\\\\\+?');
					tempvar = `.*${half1}[[:space:]]+by[[:space:]]+${half2}.*`
					console.log("[TempVar]: "+tempvar);
					
					let negx = -5
					let newx = parseInt(negx);
					
					console.log("[TEST] newx = "+newx);
				}
				catch(err) {
					console.log("[TEST]Error Caught: "+err);
				}
			}
		} else
		
		// ACTIVE
		if(command === "update" || command === "up") {
			od = "From: **"+message.author.username+"**\n";
			if (args.length > 0) {SWM(od, args, message, command);}
			if (args.length > 0) {message.author.send("Updated information received. Will process as soon as I can.  Thank you!");}
			else {message.author.send("Update was blank, thanks for nothing!");}
		} else 

		// ACTIVE
		if(command === "stats") {
			if (debug) {console.log("[STATS]Processing");}
			if (args.length == 0) {try {showStats(message,args,command);} catch(err){console.log("[STATS]Error Caught: "+err);}}
			else if (args.length > 0 && checkAdminRights(message)) {
				let arg0 = args[0].trim();
				if (arg0 == "nodirs") {
					try {
						showMissingDirs(message,args,command, function(x) {
							let ZonesMissingDirs = x[0];
							let zwdcount = x[1];
							let zmdcount = x[2];
							let od = "```\n";
							let y = 0;
							for (let i=0;i<ZonesMissingDirs.length;i++) {
								od += createSpace(ZonesMissingDirs[i],7)+"|";
								y++;
								if (y > 3) {od+="\n";y=0;}					
							}
							od += "\n```";
							message.author.send(od);
						});
					}
					catch(err) {
						console.log("[STATS]Error Caught: "+err);
					}
				} else if (arg0 == "last5") {
					try {
						showLast5(message,args,command);
					}
					catch(err) {
						console.log("[STATS]Error Caught: "+err);
					}
				}
			} else {try {showInvalidCommandMessage(message,args,command);} catch(err) {console.log("[STATS]Error Caught: "+err);}}
			
		} else
		
		// DISABLED
		if(command === "stm" && authorized) {
			if (debug) {console.log("[STM]Processing");}
			try {
				//STM(message,args,command);
			}
			catch(err) {
				console.log("[STM]Error Caught: "+err);
			}
		} else
		
		// DISABLED
		if((command === "list" || command === "li") && authorized) {
			if (debug) {console.log("[LIST]Processing");}
			if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[LIST]Error Caught: "+err);}}
			if (args[0] != '' && args[0] != null && args.length > 0) {
				if (ListOptions.indexOf(args[0].trim()) != -1) {
					let x = '';
					try {
						x = showList(args[0]);
						message.author.send(x);
						//message.author.send("Sorry, this feature is currently disabled.");
					}
					catch(err) {
						console.log("[LIST]Error Caught: "+err);
						x = "There was an error.";
						message.author.send(x);
					}
				} else if (args[0] == "help") {
					message.author.send(showListHelp());
				} else {
					message.author.send("Invalid +list option");
					message.author.send(showListHelp());
				}
			} else {message.author.send(showListHelp());}
		} else
			
		// ACTIVE
		if(command === "randomzone" || command === "rz") {
			if (args.length > 0) {
				if (args[1] != null) {try {argsIgnored(1,message,args);} catch(err){console.log("[RANDOMZONE]Error Caught: "+err);}}
				let tier = args[0].toString();
				if (tier === "tiers") {
					message.channel.send(showZoneTierInfo());			
				} else {
					try {
						pickRandomzone(tier,args,message,command, function(zone) {
							zone = ucFirstAllWords(zone);
							if (zone != '<blank>') {
								let msg = "A random zone from `Tier "+tier+"` : `"+zone+"`\n**Now get formed!!**\n";
								message.channel.send(msg);
							} else {
								let msg = "A random zone from `Tier "+tier+"` could not be chosen.";
								message.channel.send(msg);
								Error("A random zone failed to be chosen from Tier "+tier,args,message,command);
							}
						});
					}
					catch(err) {
						console.log("[RANDOMZONE]Error Caught: "+err);
					}
				}
			} else {
				message.author.send(showRandomzoneHelp());
			}
		} else
		
		// ACTIVE
		if(command === "idea") {
			od = "From: **"+message.author.username+"**\n";
			if (args.length > 0) {SWM(od, args, message, command);}
			if (args.length > 0) {message.author.send("Idea received! Will look into it asap! Thank you!");}
			else {message.author.send("Idea was blank, thanks for nothing!");}
		} else
			
		// ACTIVE
		// NEEDS WORK - 2 word classes don't work
		if(command === "legend") {
			if (args.length > 1) {argsIgnored(1,message,args);}
			if ((args[0] != '' && args[0] != null && args.length > 0) && Classes.indexOf(args[0].trim().toLowerCase()) != -1) {
				let tempMsg = showLegendShop(args[0]);
				message.author.send(tempMsg[0]);
				message.author.send(tempMsg[1]);
				if (tempMsg[2] != "") {message.author.send(tempMsg[2]);}
			} else {
				if (args.length > 0) {
					if (args[0].trim() != 'help') {
						message.author.send("Unknown Character Class: `"+args[0].trim()+"`");
						message.author.send(showLegendHelp());
					} else {message.author.send(showLegendHelp());}
				}
				else {message.author.send(showLegendHelp());}
			}
		} else
		
		// ACTIVE
		// Pretty Solid ATM
		if(command === "prep") {
			if (args.length == 0 || args[0].trim() === 'help') {
				showPrepHelp(args,message,command,function(x) {
					message.author.send(x);
				});
			} else if (args.length >= 1 && args[0].trim() != 'help') {
				listPrep(args,message,command,function(x) {
					message.author.send(x);
				});
			}
		} else
		
		// DISABLED
		if(command === "message" && (message.author.username == "TimPeplinski" || message.author.username == "Gramm" || authorized)) {
			//SWM(message,args,message,command);
		} else 
		
		// DISABLED
		if(command === "query" && authorized) {
			//ProcessQuery(message);
		} else 
		
		// ACTIVE
		if(command === "mobinfo" || command === "mi") {
			if (args.length > 0) {
				sqlStr = "SELECT * FROM mobstats WHERE name LIKE '%";
				args.forEach(
					(x) => {sqlStr += x+" ";}
				)
				sqlStr = sqlStr.trim();
				sqlStr += "%'";
				try {
					runQuery(sqlStr, function(rows) {
						if (rows.length == 1) {
							console.log("[MobInfo]MATCH FOUND:");
							ProcessMobInfo(rows,message);
						} else if (rows.length > 1) {
							console.log("[MobInfo]MORE THAN 1 MATCH FOUND");
							for (let i=0;i<rows.length;i++) {
								console.log("[MobInfo]"+i+": "+rows[i].name);					
							}
						} else if (rows.length == 0) {
							console.log ("[MobInfo] NO MOB FOUND");
						}
						console.log("[MobInfo]actual rows length: "+rows.length);
					});
				}
				catch(err) {
					console.log("[MobInfo]Error Caught: "+err);
				}
			} else {}
		} else
		
		{
			try {
				//showInvalidCommandMessage(message,args,command);
				console.log("invalid command");
			}
			catch(err) {
				console.log("[GENERAL]Error Caught: "+err);
			}
		}
	}  
});

client.login(config.token);