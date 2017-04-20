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

let fs ;
try {
	
	fs = require("original-fs")
	
}

catch (err) {
	
	fs = require("fs") ;
	
}
let path = require("path") ;
module.exports.copy = (file1,file2,overwrite=2) => {
	
	return new Promise((resolve,rejectA)=>{
		
		function reject(err,fds) {
			
			let doing = -1 ;
			function next() {
				
				doing++ ;
				
				if (doing >= fds.length) {
					
					rejectA(err) ;
					
				}
				
				else {
					
					fs.close(fds[doing],next) ;
					
				}
				
			}
			next() ;
			
		}
		
		fs.open(file1,"r",(err,fd1)=>{
			
			if (err) {
				
				reject(err,fd1) ;
				
			}
			
			else {
				
				fs.fstat(fd1,(err,stats1)=>{
					
					if (err) {
						
						reject(err,fd1) ;
						
					}
					
					else if (stats1.isDirectory()) {
						
						fs.close(fd1,err=>{
							
							if (err) {
								
								reject(err) ;
								
							}
							
							else {
								
								fs.open(file2,"r+",(err,fd2)=>{
									
									let go = (check=true) => {
										
										fs.fstat(fd2,(err,stats2)=>{
											
											if (err) {
												
												reject(err,fd2) ;
												return ;
												
											}
											
											else if (check) {
												
												if (stats2.isFile()) {
													
													reject("Dest is a file...") ;
													return ;
													
												}
												
											}
											
											fs.futimes(fd2,stats1.atime,stats1.mtime,err=>{
												
												if (err) {
													
													reject(err,fd2) ;
													
												}
												
												else {
													
													fs.fchmod(fd2,stats1.mode,err=>{
														
														if (err) {
															
															reject(err,fd2) ;
															
														}
														
														else {
															
															fs.fchown(fd2,stats1.uid,stats1.gid,err=>{
																
																if (err) {
																	
																	reject(err,fd2) ;
																	
																}
																
																else {
																	
																	fs.close(fd2,err=>{
																		
																		if (err) {
																			
																			reject(err) ;
																			
																		}
																		
																		else {
																			
																			fs.readdir(file1,(err,dir)=>{
																				
																				if (err) {
																					
																					reject(err) ;
																					
																				}
																				
																				else {
																					
																					let doing = -1 ;
																					let next =_=> {
																						
																						doing++ ;
																						
																						if (doing >= dir.length) {
																							
																							resolve() ;
																							
																						}
																						
																						else {
																							
																							module.exports.copy(path.join(file1,dir[doing]),path.join(file2,dir[doing]),overwrite).then(next).catch(reject) ;
																							
																						}
																						
																					} ;
																					next() ;
																					
																				}
																				
																			}) ;
																			
																		}
																		
																	}) ;
																	
																}
																
															}) ;
															
														}
														
													}) ;
													
												}
												
											}) ;
											
										}) ;
										
									} ;
									
									if (err) {
												
										if (err.code === "ENOENT") {
											
											fs.mkdir(file2,err=>{
												
												if (err) {
													
													reject(err) ;
													
												}
												
												else {
													
													fs.open(file2,"r+",(err,fd)=>{
														
														if (err) {
															
															reject(err) ;
															
														}
														
														else {
															
															fd2 = fd ;
															go() ;
															
														}
														
													}) ;
													
												}
												
											}) ;
											
										}
										
										else {
											
											reject(err) ;
											
										}
										
									}
									
									else {
										
										go() ;
										
									}
									
								}) ;
								
							}
							
						}) ;
						
					}
					
					else {
						
						fs.open(file2,"wx",(err,fd2)=>{
							
							let go =_=> {
								
								let write = fs.createWriteStream(file2,{
									
									fd:fd2,
									autoClose:false
									
								}) ;
								
								let read = fs.createReadStream(file1,{
									
									fd:fd1,
									autoClose:false
									
								}) ;
								
								write.on("error",err=>reject(err,fd1,fd2)) ;
								read.on("error",err=>reject(err,fd1,fd2)) ;
								
								read.on("end",_=>{
									
									fs.close(fd1,err=>{
										
										if (err) {
											
											reject(err,fd2) ;
											
										}
										
										else {
											
											fs.futimes(fd2,stats1.atime,stats1.mtime,err=>{
												
												if (err) {
													
													reject(err,fd2) ;
													
												}
												
												else {
													
													fs.fchmod(fd2,stats1.mode,err=>{
														
														if (err) {
															
															reject(err,fd2) ;
															
														}
														
														else {
															
															fs.fchown(fd2,stats1.uid,stats1.gid,err=>{
																
																if (err) {
																	
																	reject(err,fd2) ;
																	
																}
																
																else {
																	
																	fs.close(fd2,err=>{
																		
																		if (err) {
																			
																			reject(err) ;
																			
																		}
																		
																		else {
																			
																			resolve() ;
																			
																		}
																		
																	}) ;
																	
																}
																
															}) ;
															
														}
														
													}) ;
													
												}
												
											}) ;
											
										}
										
									}) ;
									
								}) ;
								
								read.pipe(write) ;
								
							} ;
							
							if (err) {
								
								if (err.code === "EEXIST") {
									
									let getFDAndGo =_=> {
										
										fs.open(file2,"w",(err,fd)=>{
											
											if (err) {
												
												reject(err) ;
												
											}
											
											else {
												
												fd2 = fd ;
												go() ;
												
											}
											
										}) ;
										
									} ;
									
									if (overwrite > 1) {
										
										getFDAndGo() ;
										
									}
									
									else if (overwrite === 1) {
										
										resolve() ;
										
									}
									
									else if (typeof overwrite === "function") {
										
										let rv = overwrite(file1,file2,mode=>{
											
											if (mode > 1 || mode === true) {
												
												fd2 = fd ;
												go() ;
												
											}
											
											else if (mode === 1 || mode === false) {
												
												resolve() ;
												
											}
											
											else {
												
												reject() ;
												
											}
											
										}) ;
										
									}
									
									else {
										
										reject(err) ;
										
									}
									
								}
								
								else {
									
									reject(err) ;
									
								}
								
							}
							
							else {
								
								go() ;
								
							}
							
						}) ;
						
					}
					
				}) ;
				
			}
			
		}) ;
		
	}) ;
	
} ;

module.exports.copySync = (file1,file2,overwrite=2) => {
	
	let fd2 = null ;
	
	try {
		
		let stats1 = fs.statSync(file1) ;
		
		if (stats1.isDirectory()) {
			
			let go = (checkDir=true) => {
				
				let stats2 = fs.fstatSync(fd2,"w") ;
				if (checkDir) {
					
					if (stats2.isFile()) {
						
						throw "Dest is a file..." ;
						
					}
					
				}
				fs.futimesSync(fd2,stats1.atime,stats1.mtime) ;
				fs.fchmodSync(fd2,stats1.mode) ;
				fs.fchownSync(fd2,stats1.uid,stats1.gid) ;
				fs.closeSync(fd2) ;
				let dir = fs.readdirSync(file1) ;
				
				for (let doing in dir) {
					
					module.exports.copySync(path.join(file1,dir[doing]),path.join(file2,dir[doing]),overwrite) ;
					
				}
				
			} ;
			
			try {
				
				fd2 = fs.openSync(file2,"r+") ;
				go() ;
				
			}
			
			catch(err) {
				
				if (err.code === "ENOENT") {
					
					fs.mkdirSync(file2) ;
					fd2 = fs.openSync(file2,"r+") ;
					go(false) ;
					return ;
					
				}
				
				else {
					
					throw err ;
					
				}
			
			}
			
		}
		
		else {
			
			try {
				
				fd2 = fs.openSync(file2,"wx") ;
				
			}
			
			catch (err) {
				
				fd2 = null ;
				if (err.code === "EEXIST") {
					
					if (overwrite > 1 || overwrite === true) {
						
						fd2 = fs.openSync(file2,"w") ;
						
					}
					
					else if (overwrite === 1 || overwrite === false) {
						
						return ;
						
					}
					
					else if (typeof overwrite === "function") {
						
						let mode = overwrite(file1,file2) ;
						
						if (mode > 1 || mode === true) {
							
							fd2 = fs.openSync(file2,"w") ;
							
						}
						
						else if (mode === 1 || mode === false) {
							
							return ;
							
						}
						
						else {
							
							throw err ;
							
						}
						
					}
					
					else {
						
						throw err ;
						
					}
					
				}
				
				else {
					
					throw err ;
					
				}
				
			}
			
			fs.writeSync(fd2,fs.readFileSync(file1)) ;
			fs.futimesSync(fd2,stats1.atime,stats1.mtime) ;
			fs.fchmodSync(fd2,stats1.mode) ;
			fs.fchownSync(fd2,stats1.uid,stats1.gid) ; 
			fs.closeSync(fd2) ;
			return ;
			
		}
		
	}
	
	catch (err) {
		
		if (fd2 !== null) {
			
			try {
				
				fs.closeSync(fd2) ;
				
			}
			
			catch (e) {
				
				console.warn(new Error(`Failed to close fd in error handler: ${e}`)) ;
				
			}
			
		}
		throw err ;
		
	}
	
} ;

module.exports.delete = toDel => {
	
	return new Promise((resolve,reject)=>{
		
		fs.stat(toDel,(err,stats)=>{
			
			if (err) {
				
				reject(err) ;
				
			}
			
			else {
				
				if (stats.isDirectory()) {
					
					fs.readdir(toDel,(err,dir)=>{
						
						if (err) {
							
							reject(err) ;
							
						}
						
						else {
							
							let doing = -1 ;
							let next =_=> {
								
								doing++ ;
								if (doing >= dir.length) {
									
									fs.rmdir(toDel,_=>{
										
										if (err) {
											
											reject(err) ;
											
										}
										
										else {
											
											resolve() ;
											
										}
										
									}) ;
									
								}
								
								else {
									
									module.exports.delete(path.join(toDel,dir[doing])).then(next).catch(reject) ;
									
								}
								
							} ;
							next() ;
							
						}
						
					}) ;
					
				}
				
				else {
					
					fs.unlink(toDel,err=>{
						
						if (err) {
							
							reject(err) ;
							
						}
						
						else {
							
							resolve() ;
							
						}
						
					}) ;
					
				}
				
			}
			
		}) ;
		
	}) ;
	
} ;

module.exports.deleteSync = toDel => {
	
	let stats = fs.statSync(toDel) ;
	
	if (stats.isDirectory()) {
		
		let dir = fs.readdirSync(toDel) ;
		
		for (let doing in dir) {
			
			module.exports.deleteSync(path.join(toDel,dir[doing])) ;
			
		}
		
		fs.rmdirSync(toDel) ;
		
	}
	
	else {
		
		fs.unlinkSync(toDel) ;
		
	}
	
} ;