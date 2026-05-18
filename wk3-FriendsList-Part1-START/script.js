// JS here

(function(){

    'use strict';
    console.log('reading js');

    // Initialize Parse
    Parse.initialize("fHhoF07nV4mL5BvrYKsUq6h9O7PSZItLG2L9I2UK", "iBZH3xwzCkFmfy1gDSoXEkwScPTBke37sWM4PXky"); //PASTE HERE YOUR Back4App APPLICATION ID AND YOUR JavaScript KEY
    Parse.serverURL = "https://parseapi.back4app.com/";

    const newBtn = document.querySelector('#newbtn');
    const editBtns = document.querySelectorAll('.fa-edit');
    const addFriendForm = document.querySelector('#add-friend');
    const editFriendForm = document.querySelector('#edit-friend');
    const friendList = document.querySelector('main ol');

    async function displayFriends() {
        const friends = Parse.Object.extend('Friends');
        const query = new Parse.Query(friends);

        try{
            const results = await query.ascending('lname').find();
            // console.log(results);

            results.forEach(function(eachFriend){
                const id = eachFriend.id;
                const lname = eachFriend.get('lname');
                const fname = eachFriend.get('fname');
                const email = eachFriend.get('email');
                const facebook = eachFriend.get('facebook');
                const twitter = eachFriend.get('twitter');
                const instagram = eachFriend.get('instagram');
                const linkedin = eachFriend.get('linkedin');
                // console.log(lname);

                const theListItem = document.createElement('li');
                theListItem.setAttribute('id', `r-${id}`);
                theListItem.innerHTML = `
                    <div class="name">${fname} ${lname}</div>
                    <div class="email">
                        <i class="fas fa-envelope-square"></i> ${email}
                    </div>
                    <div class="social">
                        <a href="${facebook}"><i class="fab fa-facebook-square"></i></a>
                        <a href="${twitter}"><i class="fab fa-twitter-square"></i></a>
                        <a href="${instagram}"><i class="fab fa-instagram"></i></a>
                        <a href="${linkedin}"><i class="fab fa-linkedin"></i></a>
                    </div>
                    <i class="fas fa-edit" id = "e-${id}"></i>
                    <i class="fas fa-times-circle" id = "d-${id}"></i>`

                // console.log(theListItem);

                friendList.append(theListItem);
            });
        } catch(error){
            console.error('Error while fetching Friends', error);
        }
    }

    displayFriends();

    newBtn.addEventListener('click', function(event){
        event.preventDefault();
        addFriendForm.className = 'add-friend-onscreen';
    });

    addFriendForm.addEventListener('submit', function(event){
        event.preventDefault();
        addFriendForm.className = 'add-friend-offscreen';
    });

    for(let i = 0; i < editBtns.length; i++){
        editBtns[i].addEventListener('click', function(event){
            event.preventDefault();
            editFriendForm.className = 'edit-friend-onscreen';
        })
    }

    editFriendForm.addEventListener('submit', function(event){
        event.preventDefault();
        editFriendForm.className = 'edit-friend-offscreen';
    });

})();