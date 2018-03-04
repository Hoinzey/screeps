const walls="walls";

function getThingTypeFromThing(tile){
    if(tile.type=="terrain"){
        return type.terrain;
    }
    if(tile.type=="structure"){
        return type.structure.structureType;
    }
    if(tile.type=="constructionSite"){
        return type.structure.structureType;
    }
}

var roomFoundations = {
    buildRoom : function(currentRoom){
        // let flags = currentRoom.find(FIND_FLAGS);
        // flags.forEach(function(flag){
        //     flag.remove();
        // })
        // let conSites = currentRoom.find(FIND_CONSTRUCTION_SITES);
        // conSites.forEach(function(site){
        //     site.remove();
        // })
        if(currentRoom.memory.lastCheckControllerLevel!=undefined){
            if(currentRoom.memory.lastCheckControllerLevel < currentRoom.controller.level){
                console.log("Building stuff")
                this.buildExtensions(currentRoom);
                this.buildContainers(currentRoom);
                this.buildPaths(currentRoom);
                currentRoom.memory.lastCheckControllerLevel = currentRoom.controller.level;
            }
        }else{
            currentRoom.memory.lastCheckControllerLevel=0;
            try{
              this.buildContainers(currentRoom);
              this.buildExtensions(currentRoom);
            }catch(err){
                console.log("Cannae handle this atm");
            }
        }
    },
    buildContainers : function(currentRoom){
        console.log("Starting Containers");
        let containerAllowance = 0;
        for(var count=0; count <= currentRoom.controller.level; count++ ){
            containerAllowance += CONTROLLER_STRUCTURES.container[count];
        }
        var currentAmountOfContainers = currentRoom.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType ==STRUCTURE_CONTAINER}).length;
        currentAmountOfContainers += currentRoom.find(FIND_CONSTRUCTION_SITES, {filter: (constructionSite) => constructionSite.structureType == STRUCTURE_CONTAINER}).length
        console.log("Total:"+containerAllowance+" Current:"+currentAmountOfContainers);
        if(currentAmountOfContainers<containerAllowance){
            currentRoom.find(FIND_SOURCES).forEach(function(source){
                // currentRoom.createFlag(currentRoom.memory.sourceinfo[source.id].x,currentRoom.memory.sourceinfo[source.id].y,null,COLOR_BLUE);
                if(currentRoom.createConstructionSite(currentRoom.memory.sourceinfo[source.id].x,currentRoom.memory.sourceinfo[source.id].y,STRUCTURE_CONTAINER)==0){
                    let containerPosition = new RoomPosition(currentRoom.memory.sourceinfo[source.id].x,currentRoom.memory.sourceinfo[source.id].y,currentRoom.name);
                    let sourceContainers = currentRoom.memory.sourceContainers;
                    let containerObject = containerPosition;
                    if(sourceContainers==undefined){
                        console.log("No memory entry");
                        sourceContainers={};
                        sourceContainers[currentRoom.name+" "+containerPosition.x+" "+containerPosition.y] = containerObject;
                        currentRoom.memory.sourceContainers = sourceContainers;
                    }else{
                        sourceContainers[currentRoom.name+" "+containerPosition.x+" "+containerPosition.y] = containerObject;
                        currentRoom.memory.sourceContainers = sourceContainers;
                    }
                }
            });
        }
        console.log("Finishing Extensions");
    },
    buildExtensions : function(currentRoom){
        console.log("Making Extensions");
        let extensionAllowance = 0;
        for(var count=0; count <= currentRoom.controller.level; count++ ){
            extensionAllowance += CONTROLLER_STRUCTURES.extension[count];
        }
        var currentAmountOfExtensions = currentRoom.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_EXTENSION}).length;
        currentAmountOfExtensions += currentRoom.find(FIND_CONSTRUCTION_SITES, {filter: (constructionSite) => constructionSite.structureType == STRUCTURE_EXTENSION}).length
        if(currentAmountOfExtensions<extensionAllowance){
            currentRoom.find(FIND_MY_SPAWNS).forEach(function(spawn){
                let offset=2;
                while(currentAmountOfExtensions<extensionAllowance){
                    let xPos = spawn.pos.x - offset;
                    let yPos = spawn.pos.y - offset;
                        for(xPos; xPos<=spawn.pos.x+offset ;xPos++){
                            if(currentAmountOfExtensions==extensionAllowance){
                                break;
                            }
                            console.log("X: "+xPos);
                            yPos = spawn.pos.y - offset;
                            for(yPos;yPos<=spawn.pos.y+offset;yPos++){
                                console.log("Y: "+yPos);
                                console.log("Validating X:"+xPos+" Y:"+yPos+" total is at "+currentAmountOfExtensions+" of "+extensionAllowance);
                                console.log("Offset: "+offset);
                                if(currentAmountOfExtensions==extensionAllowance){
                                    break;
                                }
                                if(checkAdjacentSquaresForExtensionOrWall(xPos,yPos,currentRoom)===true){
                                    console.log("---------------------------------------------------------------")
                                    if(currentRoom.createConstructionSite(xPos,yPos,STRUCTURE_EXTENSION) == 0){
                                        currentAmountOfExtensions++
                                        surroundWithPaths(xPos,yPos,currentRoom);
                                        // currentRoom.createConstructionSite(x-1,y,STRUCTURE_ROAD);
                                        // currentRoom.createConstructionSite(x+1,y,STRUCTURE_ROAD);    
                                        console.log("---------------------------------------------------------------")
                                    }
                                }
                            }
                        }
                        console.log("-increasing offset")
                    // offset++
                }
            });
        }
        console.log("Finishing Extensions");
    },
    buildPaths : function(currentRoom){
        _.each(currentRoom.find(FIND_MY_SPAWNS),function(spawn){
            let spawnInformation = currentRoom.memory.spawnInfo;
            // console.log(spawnInformation);
            if(spawnInformation==undefined){
                let spawnObject = {x:spawn.pos.x,y:spawn.pos.y};
                let  spawnInfo={};
                spawnInfo[spawn.id] = spawnObject;
                currentRoom.memory.spawnInfo=spawnInfo;
            }else if(!_.contains(spawnInformation,spawnInformation[spawn.id])){
                let spawnObject = {x:spawn.pos.x,y:spawn.pos.y};
                currentRoom.memory.spawnInfo[spawn.id] = spawnObject;
            }
            let targets = pathTargets(currentRoom);
            // console.log(targets.length);
            _.each(targets,function(target){
                let tarPos = new RoomPosition(target.x,target.y,currentRoom.name);
                let pathTiles = currentRoom.findPath(spawn.pos,tarPos,{ignoreCreeps:true});
                pathTiles.forEach(function(dest){
                    currentRoom.createConstructionSite(dest.x,dest.y,STRUCTURE_ROAD)
                    // }
                    // currentRoom.createFlag(dest.x,dest.y,null,COLOR_RED);
                });
            })
            
        })
    }
};

function checkAdjacentSquaresForExtensionOrWall(x,y,currentRoom){
    let offset=1;
    let xPosition = x - offset;
    let yPosition = y - offset;
    let validTile=true;
    let hasSomethingBesideIt=false;
    // console.log("_____________"+x+"_____________________"+y);
    currentRoom.lookAtArea(y+1,x-1,y+1,x+1,{asArray:true});
    var targets = currentRoom.lookAtArea(y-1,x-1,y+1,x+1,{asArray:true});
    // console.log("-----------------");
    // _.each(targets,function(thing){
    //         console.log(JSON.stringify(thing));
    // })
    // console.log("-----------------");
    if(_.findWhere(targets,{type: "terrain", terrain: "wall"})){
        console.log("Failing at wall")
        validTile=false;
    }
    // console.log("After looking for wall:"+validTile+" in :"+JSON.stringify(targets));
    if(validTile==false){
        return false;
    }
    if(_.findWhere(targets,{type: "structure", structure: {structureType: "spawn"}})){
        console.log("I am indeed beside a cons spawn")
        hasSomethingBesideIt=true;
    }
    if(_.findWhere(targets,{type: "constructionSite"})){
        console.log("I am indeed beside a cons site")
        hasSomethingBesideIt=true;
    }
    
    if(currentRoom.lookForAt(LOOK_STRUCTURES,x,y).length){
        console.log("Cannae build due to a structure being here already")
        validTile=false;
    }else if(currentRoom.lookForAt(LOOK_CONSTRUCTION_SITES,x,y).length){
        console.log("Cannae build due to a site being here already")
        validTile=false;
    }
     return validTile && hasSomethingBesideIt;
}

function surroundWithPaths(x,y,currentRoom){
    let offset=1;
    let xPos = x-offset;
    let yPos = y-offset;
    for(xPos ; xPos<x+offset; xPos++){
        yPos = y-offset;
        for(yPos; yPos<y+offset; yPos++){
            currentRoom.createConstructionSite(xPos,yPos,STRUCTURE_ROAD)
        }            
    }
}

function pathTargets(currentRoom){
    var targets = [];
    currentRoom.find(FIND_SOURCES).forEach(function(source){
        targets.push({x:source.pos.x,y:source.pos.y});
    });
    currentRoom.find(FIND_MY_SPAWNS).forEach(function(spawn){
        let offset=1;
        let xPos = spawn.pos.x - offset;
        let yPos = spawn.pos.y - offset;
        for(var x =xPos; x<=spawn.pos.x+offset ;x++){
            for(var y=yPos;y<=spawn.pos.y+offset;y++){
                //  if(x==spawn.pos.x+1 && y==spawn.pos.y+1){
                //     currentRoom.createConstructionSite(x,y,STRUCTURE_CONTAINER);
                //     continue;
                // }
                // currentRoom.createFlag(x,y);
                let obj = {x:x,y:y};
                // console.log(obj.x + " "+ obj.y);
                targets.push(obj);
            }
        }
        targets.push({x:spawn.pos.x,y:spawn.pos.y});
    });
    targets.push({x:currentRoom.controller.pos.x,y:currentRoom.controller.pos.y});
    return targets;
}

module.exports = roomFoundations;