/*
	Copyright 2017 Jacob O'Toole
	
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	    http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

let currentDir = "/" ;
let fs = require("fs") ;
let path = require("path") ;
let JPOS = require("JPOS") ;

let list = document.getElementById("list") ;
let locationInput = document.getElementById("location") ;
let box = document.getElementById("box") ;
let upButton = document.getElementById("up") ;

function giveMeErrors(err) {
	
	throw new Error(err) ;
	
}

let currentlySelectedFiles = new Array() ;
function addSelectListeners(elem,openFunc) {
	
	elem.addEventListener("click",_=>{
		
		if (currentlySelectedFiles.indexOf(elem) !== -1) {
			
			elem.classList.remove("selected") ;
			currentlySelectedFiles.splice(currentlySelectedFiles.indexOf(elem),1) ;
			
		}
		
		else {
			
			if (!ctrlDown) {
				
				for (let doing in currentlySelectedFiles) {
					
					currentlySelectedFiles[doing].classList.remove("selected") ;
					currentlySelectedFiles = [] ;
					
				}
				
			}
			
			elem.classList.add("selected") ;
			currentlySelectedFiles.push(elem) ;
			
		}
		
	}) ;
	
	if (typeof openFunc === "function") {
		
		elem.addEventListener("dblclick",openFunc) ;
		
	}
	
}

function renderDir(d) {
	
	console.log("Rendering",d) ;
	list.innerHTML = "" ;
	fs.readdir(d,(err,dir)=>{
		
		if (err) {
			
			giveMeErrors(err) ;
			return ;
			
		}
		
		console.log("DIR contents:",dir) ;
		let x = new Array() ;
		let dirs = new Array() ;
		let files = new Array() ;
		
		let doing = -1 ;
		
		let next =_=> {
			
			doing++ ;
			if (doing >= dir.length) {
				
				for (let doing in x) {
					
					let creating = document.createElement("li") ;
					creating.classList.add("item") ;
					creating.classList.add("file-err") ;
					creating.innerText = x[doing] ;
					creating.jpos_path = path.join(d,x[doing]) ;
					creating.jpos_type = "err" ;
					addSelectListeners(creating) ;
					list.appendChild(creating) ;
					
				}
				for (let doing in dirs) {
					
					let creating = document.createElement("li") ;
					creating.classList.add("item") ;
					creating.classList.add("dir") ;
					creating.innerText = dirs[doing] ;
					creating.jpos_path = path.join(d,dirs[doing]) ;
					creating.jpos_type = "dir" ;
					addSelectListeners(creating,_=>{
						
						currentDir = path.join(d,dirs[doing]) ;
						locationInput.value = currentDir ;
						renderDir(currentDir) ;
						
					}) ;
					list.appendChild(creating) ;
					
				}
				for (let doing in files) {
					
					let creating = document.createElement("li") ;
					creating.classList.add("item") ;
					creating.classList.add("file") ;
					creating.innerText = files[doing] ;
					creating.jpos_path = path.join(d,files[doing]) ;
					creating.jpos_type = "file" ;
					addSelectListeners(creating,_=>{
						
						JPOS.open(path.join(currentDir,files[doing])) ;
						
					}) ;
					list.appendChild(creating) ;
					
				}
				return ;
				
			}
			
			fs.stat(path.join(d,dir[doing]),(err,stats)=>{
				
				if (err) {
					
					x.push(dir[doing]) ;
					next() ;
					giveMeErrors(err) ;
					return ;
					
				}
				
				else if (stats.isDirectory()) {
					
					dirs.push(dir[doing]) ;
					
				}
				
				else {
					
					files.push(dir[doing]) ;
					
				}
				
				next() ;
				
			}) ;
			
		} ;
		next() ;
		
	}) ;
	
}

box.addEventListener("submit",e=>{
	
	e.preventDefault() ;
	currentDir = locationInput.value ;
	renderDir(currentDir) ;
	return false ;
	
}) ;

upButton.addEventListener("click",_=>{
	
	currentDir = currentDir.replace(/\\/g,"/").split("/") ;
	currentDir.pop() ;
	currentDir = currentDir.join("/") ;
	if (currentDir === "") {
		
		currentDir = "/" ;
		
	}
	locationInput.value = currentDir ;
	renderDir(currentDir) ;
	
}) ;

let ctrlDown = false ;
document.body.addEventListener("keydown",e=>{
	
	if (e.key === "Control") {
		
		ctrlDown = true ;
		
	}
	
}) ;
document.body.addEventListener("keyup",e=>{
	
	if (e.key === "Control") {
		
		ctrlDown = false ;
		
	}
	
}) ;

let clip = require("electron").clipboard ;
document.getElementById("button-copy").addEventListener("click",_=>{
	
	let toAdd = new String() ;
	cutFiles = [] ;
	for (let doing in currentlySelectedFiles) {
		
		if (parseInt(doing) > 0) {
			
			toAdd += "\n" ;
			
		}
		toAdd += "file://" ;
		toAdd += currentlySelectedFiles[doing].jpos_path ;
		
	}
	clip.writeText(toAdd) ;
	
}) ;
document.getElementById("button-copy-path").addEventListener("click",_=>{
	
	let toAdd = new String() ;
	for (let doing in currentlySelectedFiles) {
		
		if (parseInt(doing) > 0) {
			
			toAdd += "\n" ;
			
		}
		toAdd += currentlySelectedFiles[doing].jpos_path ;
		
	}
	clip.writeText(toAdd) ;
	
}) ;
let cutFiles = new Array() ;
let cutFilesClip = new String() ;
document.getElementById("button-cut").addEventListener("click",_=>{
	
	let toAdd = new String() ;
	cutFiles = [] ;
	for (let doing in currentlySelectedFiles) {
		
		if (parseInt(doing) > 0) {
			
			toAdd += "\n" ;
			
		}
		toAdd += "file://" ;
		toAdd += currentlySelectedFiles[doing].jpos_path ;
		cutFiles.push(currentlySelectedFiles[doing].jpos_path) ;
		
	}
	cutFilesClip = toAdd ;
	clip.writeText(toAdd) ;
	
}) ;
let url = require("url") ;
let fsp = require("fs+") ;
document.getElementById("button-paste").addEventListener("click",_=>{
	
	let todo = clip.readText() ;
	let doCut = Boolean(todo===cutFilesClip) ;
	todo = todo.split("\n") ;
	for (let doing in todo) {
		
		let purl = url.parse(todo[doing]) ;
		if (purl.protocol !== "file:") {
			
			alert("No files on the clipboard...","Error Pasting!") ;
			return ;
			
		}
		todo[doing] = purl.path ;
		if (process.platform === "win32") {
			
			todo[doing] = `${purl.host.toUpperCase()}:${purl.path}` ;
			
		}
		
	}
	for (let doing in todo) {
		
		console.log(`Copy ${todo[doing]} to ${path.join(currentDir,path.basename(todo[doing]))}`) ;
		fsp.copySync(todo[doing],path.join(currentDir,path.basename(todo[doing]))) ;
		
	}
	if (doCut && confirm("Delete cut files?","Move?")) {for (let doing in cutFiles) {
		
		console.log(`Now deleting ${cutFiles[doing]}`) ;
		
	}}
	else {
		
		cutFiles = [] ;
		
	}
	renderDir(currentDir) ;
	
}) ;
let ofs = require("original-fs") ;
document.getElementById("button-delete").addEventListener("click",_=>{
	
	let toDel = new Array() ;
	for (let doing in currentlySelectedFiles) {
		
		toDel.push(currentlySelectedFiles[doing].jpos_path) ;
		
	}
	
	if (!Boolean(JPOS.popupSync({
		
		title:"Confirm Delete",
		message:"Are you sure you want to delete:",
		details:toDel.join("\n"),
		options:["Delete the files","CANCEL!!!"],
		closeButton:1
		
	}))) {
		
		for (let doing = 0 ; doing < toDel.length ; doing++) {
			
			try {
				
				ofs.unlinkSync(toDel[doing]) ;
				
			}
			
			catch (err) {
				
				if (JPOS.popupSync({
					
					title:"File system error",
					message:`Error deleting "${toDel[doing]}: ${err.code}"`,
					options:["Retry","Skip"]
				
				}) === 0) {
					
					doing-- ;
					
				}
				
			}
			
		}
		renderDir(currentDir) ;
		
	}
	
}) ;
document.getElementById("button-new-file").addEventListener("click",_=>{
	
	let fileName = JPOS.popupSync({
		
		title:"New file",
		message:"Please enter the path of the new file:",
		input:{
			
			value:fs.realpathSync(path.join(currentDir))+"/",
			button:"Create"
			
		}
		
	}) ;
	if (fileName === -1 || !Boolean(fileName)) {
		
		return ;
		
	}
	fs.writeFileSync(fileName,"") ;
	renderDir(currentDir) ;
	
}) ;

renderDir(currentDir) ;