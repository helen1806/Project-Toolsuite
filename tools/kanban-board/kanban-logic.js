'use strict';

const STORAGE_KEY = 'toolsuite_kanban_v2';

const lists = [
    'todo',
    'progress',
    'done'
];


let boardData = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {

    todo: [],
    progress: [],
    done: []

};





// ----------------------------
// INITIAL LOAD
// ----------------------------


lists.forEach(listId => {


    const container =
        document.getElementById(listId);



    boardData[listId].forEach(item => {


        container.appendChild(

            createCard(
                item.text,
                item.label
            )

        );


    });



    new Sortable(
        container,
        {

            group: 'kanban_group',

            animation: 150,

            ghostClass: 'ghost-card',

            onEnd: saveBoardState

        }

    );

});









// ----------------------------
// SAFE CARD CREATION
// ----------------------------


function createCard(text, label) {


    const card =
        document.createElement('div');


    card.className =
        "task-card";





    const labelDiv =
        document.createElement('div');


    labelDiv.className =
        `label label-${label}`;


    labelDiv.textContent =
        label;





    const textDiv =
        document.createElement('div');


    textDiv.className =
        "task-text";


    // IMPORTANT SECURITY FIX
    textDiv.textContent =
        text;







    const deleteBtn =
        document.createElement('span');


    deleteBtn.className =
        "delete-btn";


    deleteBtn.textContent =
        "×";




    deleteBtn.addEventListener(
        "click",
        () => {


            if (confirm(
                "Delete this task permanently?"
            )) {


                card.remove();


                saveBoardState();


            }


        }

    );





    card.appendChild(labelDiv);

    card.appendChild(textDiv);

    card.appendChild(deleteBtn);





    return card;


}









// ----------------------------
// ADD TASK
// ----------------------------


window.addNewTask = function (listId) {


    const labelSelect =
        document.getElementById(
            `${listId}-label`
        );



    const label =
        labelSelect.value;



    const taskText =
        prompt(
            "Enter task description:"
        );




    if (
        taskText &&
        taskText.trim() != ""
    ) {


        const container =
            document.getElementById(listId);



        container.appendChild(

            createCard(
                taskText.trim(),
                label
            )

        );



        saveBoardState();



        labelSelect.value =
            "none";


    }


};









// ----------------------------
// SAVE STATE
// ----------------------------


function saveBoardState() {


    const newState = {};



    lists.forEach(listId => {


        const cards =
            document.querySelectorAll(
                `#${listId} .task-card`
            );



        newState[listId] =
            Array.from(cards)
                .map(card => {


                    return {


                        text:
                            card.querySelector(
                                ".task-text"
                            )
                                .textContent,



                        label:
                            card.querySelector(
                                ".label"
                            )
                                .textContent
                                .toLowerCase()


                    };


                });


    });




    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(newState)

    );


}