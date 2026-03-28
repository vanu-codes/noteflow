let textarea = document.querySelector("#noteInput");
let addbtn = document.querySelector("#addNoteBtn");
let notescontainer = document.querySelector("#notesContainer");
let cancelbtn = document.querySelector("#cancelnotebtn");
let searchInput = document.querySelector("#searchInput");
const userManager = {
    //STATE
    notes: [],
    searchTerm: "",
    currentEditId: null,
    lastChanged: null,
    timer: null,

    //METHODS
    getnotes: function(){
        let storedNotes = localStorage.getItem("note");
        if(storedNotes){
            this.notes = JSON.parse(storedNotes);          
        }
        this.renderUi();
    },
    
    init: function(){
        this.getnotes();
        addbtn.addEventListener("click", this.addNotes.bind(this));    
        notescontainer.addEventListener("click",this.handleClick.bind(this)); 
        textarea.addEventListener("keydown", this.handleEnter.bind(this)); 
        cancelbtn.addEventListener("click", this.cancelEdit.bind(this));  
        searchInput.addEventListener("input", this.handleSearch.bind(this));
    },
    handleSearch: function(){     
        clearTimeout(this.timer);      
        this.timer = setTimeout(()=>{
            this.searchTerm = searchInput.value.toLowerCase().trim();
            this.renderUi();
        },300)
        
    },
    cancelEdit: function(){
        this.resetEditState();
    },
    handleEnter: function(ent){
        if(ent.key === "Enter" && !ent.shiftKey){
            ent.preventDefault();
            this.addNotes();
        }
    },
    handleClick: function(e){
        let getButton = e.target.closest("button");
        if(getButton === null){
            return;
        }
        const action = getButton.dataset.action;

        if(typeof this[action] !== "function"){
            return;
        }
        
        this[action](getButton);

    },
    editNote: function(editbtn){
        const editbtnId = Number(editbtn.dataset.id);
        this.currentEditId = editbtnId;
        let foundNote = this.notes.find((Editnote)=>{
            return editbtnId === Editnote.id
        });
        if(!foundNote) return;

        //textarea value 
        textarea.value = foundNote.text;  
        addbtn.textContent = "Update Note";
        //adding classes
        textarea.classList.add("edit-mode");
        cancelbtn.classList.add("show-cancel");

             
    },
    
    pinNote: function(pinbtn){
        const pinBtnId = Number(pinbtn.dataset.id);
        this.lastChanged = pinBtnId;

        this.notes = this.notes.map((note)=>{
            if(note.id === pinBtnId){
                return{
                    ...note,
                    pinned: !note.pinned
                }
            }
            return note;
        })

        

        this.updateLocal();
    },
    addNotes: function(){
        let textValue = textarea.value.trim();
        if(this.currentEditId !== null){          
            let currentNote = this.notes.find((note)=>{
                return this.currentEditId === note.id;
            })
            if(!currentNote){
                return;
            }
            if(textValue === ""){
                alert("You did not enter any text");
                return;
            }
            if(currentNote.text.trim() === textValue){
                return;
            }
            
            this.notes = this.notes.map((note)=>{
                if(note.id === this.currentEditId){
                    return {
                        ...note,
                        text: textValue,
                    }
                }
                else{
                    return note;
                }
            })
        }
        else{
            
            if(textValue === ""){
                alert("You did not enter any text");
                return;
            }
            
            this.notes.push({
                id: Date.now(),
                text: textValue,
                pinned: false,
            });               
            
        }   
        //calling methods
        this.resetEditState();
        this.updateLocal();
        
    },
    updateLocal: function(){
        localStorage.setItem("note",JSON.stringify(this.notes));
        this.renderUi();
    },
    renderSection: function(title, notesArray, fragment){
        if(notesArray.length === 0) return;

        const heading = document.createElement("h3");
        heading.textContent = title;
        fragment.appendChild(heading);

        notesArray.forEach(note => {
            const element = this.createNoteElement(note);
            fragment.appendChild(element);
        })
    },
    renderUi: function(){
        let filteredNotes;
        const firstPositions = new Map(); 
      
        document.querySelectorAll(".note").forEach((el)=>{
            
            const id = Number(el.dataset.id);
            firstPositions.set(id,el.getBoundingClientRect());
        });
      
        notescontainer.innerHTML = "";

        const fragment = document.createDocumentFragment();

        if(!this.searchTerm){
            filteredNotes = this.notes;
        }
        else{
            filteredNotes = this.notes.filter((note)=>{
                return note.text.toLowerCase().trim().includes(this.searchTerm);
                
        })
        }    

        const pinnedNotes = [];
        const unpinnedNotes = [];
        //sort section

        filteredNotes.forEach(note => {
            if(note.pinned){
                pinnedNotes.push(note);
            }
            else{
                unpinnedNotes.push(note);
            }
        })

        this.renderSection("Pinned Notes", pinnedNotes, fragment)
        this.renderSection("Other Notes", unpinnedNotes, fragment)

        

        if(pinnedNotes.length === 0 && unpinnedNotes.length === 0){
            let noNoteh3 = document.createElement("h3");
            noNoteh3.textContent = "No notes yet  Add something...";
            fragment.appendChild(noNoteh3);
        }

                   
        //Append mainDiv
        
            
        notescontainer.appendChild(fragment);  


        //flip function end
        requestAnimationFrame(()=>{
            document.querySelectorAll(".note").forEach((el)=>{
                const id = Number(el.dataset.id);
                const first = firstPositions.get(id);
                const last = el.getBoundingClientRect();

                if(!first) return;

                const deltaY = first.top - last.top;

                if(deltaY !== 0){
                    el.style.transform = `translateY(${deltaY}px)`;

                    el.style.transition = "transform 0s";

                    requestAnimationFrame(()=>{
                        el.style.transform = "";

                        el.style.transition = "transform 0.3s ease";
                    });
                }
            });
        });

        setTimeout(()=>{
            document.querySelectorAll(".note-enter").forEach((el)=>{
                el.classList.remove("note-enter");
                el.classList.add("note-show");
            });
            this.lastChanged = null;
        },0) 
    },
    createButton: function(text , className, id, action){
        const btn = document.createElement("button")
        btn.textContent = text;
        btn.classList.add(className);
        btn.dataset.id = id;
        btn.dataset.action = action;
        return btn;
    },
    createNoteElement: function(note){
        //main Div
            let mainDiv = document.createElement("div");
            mainDiv.classList.add("note");
            mainDiv.dataset.id = note.id;
            if(note.pinned){
                mainDiv.classList.add("pinned");
            }
            
            if(note.id === this.lastChanged){
                mainDiv.classList.add("note-enter");
            }
            //text
            let ptext = document.createElement("p");
            let text = note.text;
            if(this.searchTerm){
                text = text.replace(
                    new RegExp(this.searchTerm, "gi"),`<span class="highlight">${this.searchTerm}</span>`
                )
                ptext.innerHTML = text;
            }
            else{
                ptext.textContent = note.text;
            }
            
            
            //button Div
            let btnDiv = document.createElement("div");
            btnDiv.classList.add("note-actions");
            

            //delete button
            let delbtn = this.createButton("Delete","delete-btn", note.id, "removeNote");
            
            
            //edit button
            let editbtn = this.createButton("Edit","edit-btn", note.id, "editNote");

            //pin button
            let pinbtn = this.createButton(
                note.pinned ? "Unpin" : "Pin",
                "pin-btn",
                 note.id,
                "pinNote");

            //Append buttons
            btnDiv.appendChild(delbtn);
            btnDiv.appendChild(editbtn);
            btnDiv.appendChild(pinbtn);

            //Append text + Button div
            mainDiv.appendChild(ptext);
            mainDiv.appendChild(btnDiv);

            return mainDiv;
    },
    removeNote: function(delbtn){
        const buttonId = Number(delbtn.dataset.id); //get delete button id
        if(isNaN(buttonId)) return; // check is id is Nan then return 

        const oldLength = this.notes.length; // store the length of note before filter
        this.notes = this.notes.filter((item)=> item.id !== buttonId ) //finding click button id !== note id and removing button id === note id
        // store the length of note after filter coz we click on delete button and thst note is note pass by filter
        const newLength = this.notes.length; 
        //compareing old and new length if both are not same means filter is done and note is deleted and update local storage
        if(oldLength !== newLength){
            this.updateLocal();
        }       
    },
    resetEditState: function(){
        
        //Add Button text change
        addbtn.textContent = "Add Note";
        //Current Edit Id inserting null
        this.currentEditId = null;
        //Clearing textarea value
        textarea.value = "";
        //removing classes
        textarea.classList.remove("edit-mode");
        cancelbtn.classList.remove("show-cancel");
        //Update local storage
        
    }
}
userManager.init();