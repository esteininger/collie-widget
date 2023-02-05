"use strict";

class CollieWidget {
    on = false;
    toggling = false;

    constructor() {
        let src = document.getElementById('colwid');

        if (!src){
            console.log('Could not find the div to bind');
            return;
        }

        this.fetchHTML().then(([button, modal]) => {
            src.innerHTML = button;
            document.body.insertAdjacentHTML('beforeend', modal);
            src.addEventListener('click', this.toggle.bind(this));
            document.addEventListener('keydown', this.shortcuts.bind(this), false);
            document.getElementById('colwid_modal').addEventListener('click', this.toggleClick.bind(this));
            
        }).catch(error => {            
            src.innerHTML = `<span class="colwid_error">${error}</span>`;

        });

    }

    async fetchHTML(type = 'button'){
        const [buttonResponse, modalResponse] = await Promise.all([
            fetch('button.html'),
            fetch('modal.html')
        ]);

        if (!buttonResponse.ok || !modalResponse.ok) {
            throw new Error('Could not fetch the widget HTML');
        }

        const button = await buttonResponse.text();
        const modal = await modalResponse.text();

        return [button, modal];

    }   
    
    shortcuts(event){        
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            this.toggle();
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
        if (event.target.className == 'wrap_0402'){
            this.toggle();
        }
    }

}

document.addEventListener("DOMContentLoaded", function () {
    new CollieWidget();
});
