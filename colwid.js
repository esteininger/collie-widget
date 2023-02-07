"use strict";

class CollieWidget {    
    button_src = null;
    category = null;
    config = {};    
    on = false;    
    toggling = false;

    constructor() {
        this.button_src = document.getElementById('colwid');

        if (!this.button_src){
            console.log('Could not find the div to bind');
            return;
        }               

        this.fetchHTML().then(([button, modal, config]) => {
            this.button_src.innerHTML = button;            
            document.body.insertAdjacentHTML('beforeend', modal);      
            this.config = config;                                 
            this.events();      
            
        }).catch(error => {            
            src.innerHTML = `<span class="colwid_error">${error}</span>`;

        });

    }

    categorySet(){      
        let category = this.button_src.dataset.category || this.config.category_default;

        if (category && category in this.config.category_allowed){                
            this.category = category;
            document.getElementById('colwid_category').style.display = 'flex';
            document.querySelector('#colwid_category span').innerText = this.config.category_allowed[this.category];

            document.querySelector('#colwid_category button').addEventListener('click', () => {
                this.category = null;               
                document.getElementById('colwid_category').style.display = 'none';
                document.querySelector('#colwid_category span').innerText = '';
            });

        }        

    }

    async fetchHTML(type = 'button'){
        const [buttonResponse, modalResponse, configResponse] = await Promise.all([
            fetch('button.html'),
            fetch('modal.html'),
            fetch('config.json')
        ]);

        if (!buttonResponse.ok || !modalResponse.ok || !configResponse) {
            throw new Error('Could not fetch the widget HTML / configuration');
        }

        const button = await buttonResponse.text();
        const modal = await modalResponse.text();
        const config = await configResponse.json();

        return [button, modal, config];

    }   

    events(src){
        //  Main click
        this.button_src.addEventListener('click', this.toggle.bind(this));

        //  Shortcuts
        document.addEventListener('keydown', this.shortcuts.bind(this), false);

        //  Click on the layer to close, need to check if it's not clicking on the main modal
        document.getElementById('colwid_modal').addEventListener('click', this.toggleClick.bind(this));

        //  Main input focus / blur
        ['focus', 'blur'].forEach(event_type => {
            document.getElementById('colwid_input').addEventListener(event_type, event => {               
                event.target.parentElement.classList.toggle('colwid_focus');
            });
        });        

    }
    
    shortcuts(event){    
        //  ctrl + k    
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            this.toggle();

        //  escape
        }else if (event.key === 'Escape' && this.on){
            this.toggle();
        }
        
    }

    toggle() {
        if (!this.toggling){
            this.toggling = true;
            let modal = document.getElementById('colwid_modal');                      
          
            document.body.style.marginRight = this.on ? '0px' : '15px';
            document.body.style.overflow = this.on ? 'auto' : 'hidden';

            if (!this.on){
                modal.style.display = 'block';                
                this.categorySet();
                document.getElementById('colwid_input').focus();
            }

            document.body.offsetHeight;                     
            modal.style.opacity = this.on ? 0 : 1;            

            setTimeout(() => {
                this.toggling = false;
                if (this.on){
                    modal.style.display = 'none';
                }
                this.on = !this.on;
            }, 300);
                        
        }

    }

    toggleClick(event) {
        if (event.target.className == 'wrap_pfx'){
            this.toggle();
        }
    }

}

document.addEventListener("DOMContentLoaded", function () {
    new CollieWidget();
});
