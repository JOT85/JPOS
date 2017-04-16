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

let tasks = new Array() ;
let taskTypes = ["task-min","task-blur","task-focus"] ;
let currentlyFocused = -1 ;

if (cs.taskbarPosition === "bottom") {
	
	taskbar.style.bottom = "0px" ;
	desktop.style.top = "0px" ;
	
}

else if (cs.taskbarPosition === "top") {
	
	taskbar.style.top = "0px" ;
	desktop.style.bottom = "0px" ;
	
}

taskbar.style.backgroundColor = cs.taskbarBG ;

function toggleAll() {
	
	windows.classList.toggle("min-all") ;
	taskbar.classList.toggle("min-all") ;
	document.getElementById("down_button").classList.toggle("acc-up-button") ;
	
}

document.getElementById("down_button").addEventListener("click",toggleAll) ;

//Use garbCollect function from windows.js

function addTask(up,title,focusFunc,pointer,hidden=false) {
	
	let thisItem = document.createElement("div") ;
	thisItem.classList.add("task") ;
	thisItem.innerText = title ;
	thisItem.classList.add(taskTypes[up]) ;
	thisItem.addEventListener("click",_=>focusFunc("task")) ;
	let task = {
		
		set up(v) {
			
			thisItem.classList.remove(taskTypes[up]) ;
			up = v ;
			thisItem.classList.add(taskTypes[up]) ;
			
		},
		get up() {
			
			return up ;
			
		},
		elem:thisItem,
		set title(v) {
			
			thisItem.innerText = v ;
			
		},
		get title() {
			
			return thisItem.innerText ;
			
		},
		pointer:pointer
		
	} ;
	if (hidden) {
		
		thisItem.style.display = "none" ;
		
	}
	task.show =_=> {
		
		thisItem.style.display = "inline-block" ;
		
	} ;
	task.hide =_=> {
		
		thisItem.style.display = "none" ;
		
	} ;
	taskbar.appendChild(thisItem) ;
	let index = tasks.push(task) - 1 ;
	task.index = index ;
	return task ;
	
}

function removeTask(task) {
	
	taskbar.removeChild(task.elem) ;
	tasks[task.index] = null ;
	console.info("Rememer to call garbCollect after removeing a task!") ;
	
}