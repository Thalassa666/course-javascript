require('./index.html');

VK.init({
    apiId: 7968262
});

function auth() {
    return new Promise((resolve, reject) => {
        VK.Auth.login(data => {
            if (data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
}

function callAPI(method, params) {
    params.v = '5.131';

    return new Promise((resolve, reject) => {
        VK.api(method, params, (data) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        });
    })
}
//
(async () => {
    try {
        await auth();
        // const [me] = await callAPI('users.get', { name_case: 'gen'});
        const friends = await callAPI('friends.get', { fields: 'photo_100' });
        const template = document.querySelector('#friendTemplate').textContent;
        // console.log(friends)
        const render = Handlebars.compile(template);
        const html = render(friends);
        const results = document.querySelector('#allFriends');
        document.querySelector('.friends-container').classList.remove('waiting');

        results.innerHTML = html;
    } catch (e) {
        console.error(e.message);
    }
})();

// при mousedown на друга вешается draggable true.
// Зачем? Почему не прописать инлайном в темплейте? -потому что так солиднее,
// так практичнее и без лишних данных в самом html
document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'HTML') {
        return;
    }
    const isAllFriendsParent = e.target.parentNode.classList.contains('friends__list');
    const isAllFriendsGranddad = e.target.parentNode.parentNode.classList.contains('friends__list');

    isAllFriendsParent && (e.target.draggable = true) ||
    isAllFriendsGranddad && (e.target.parentElement.draggable = true);
});

// Просто ховер эффект при перетаскивании
document.addEventListener('dragenter', (e) => {
    e.target.classList.contains('friends__list') && e.target.classList.add('drop');
});

// удаление ховер эффекта
document.addEventListener('dragleave', (e) => {
    e.target.classList.contains('drop') && e.target.classList.remove('drop');
});

// при старте записывает дата-айди
document.addEventListener('dragstart', (e) => {
    e.target.classList.contains('friend') && e.dataTransfer.setData("text/plain", e.target.dataset.id);
});

let elemBelow = "";

// Дропать можно либо на друга, либо в список друзей
document.addEventListener('dragover', (e) => {
    e.target.classList.contains('friend') && e.preventDefault();
    e.target.classList.contains('friends__list') && e.preventDefault();
    elemBelow = e.target;
});

document.addEventListener('drop', (e) => {
    const element = document.querySelector(
        `[data-id="${e.dataTransfer.getData("text/plain")}"]`
    );

    // ?
    if (elemBelow === element) {
        elemBelow.removeAttribute('draggable');
        return;
    }

    elemBelow.parentElement.classList.contains('friends')
        ? element.children[2].classList = 'arrow toBestFriend'
        : element.children[2].classList = 'arrow toFriend';

    element.removeAttribute('draggable');

    if(e.target.classList.contains('friend')) {
        const center = elemBelow.getBoundingClientRect().y + elemBelow.getBoundingClientRect().height / 2;
        if (e.clientY > center) {
            if (elemBelow.nextElementSibling !== null) {
                elemBelow = elemBelow.nextElementSibling;
            } else {
                return;
            }
        }

        elemBelow.parentElement.insertBefore(element, elemBelow);
        element.className = elemBelow.className;
    }

    if(e.target.classList.contains('friends__list')) {
        e.target.append(element)

        if (e.target.classList.contains("drop")) {
            e.target.classList.remove("drop");
        }
    }
});

document.addEventListener('click', (e) => {
    const isArrow = e.target.classList.contains('arrow');
    const toFriend = e.target.classList.contains('toFriend');
    const toBestFriend = e.target.classList.contains('toBestFriend');
    if (isArrow) {
        if (toBestFriend) {
            e.target.classList = 'arrow toFriend';
            document.querySelector('#allBestFriends').appendChild(e.target.parentElement);
        } else if (toFriend) {
            e.target.classList = 'arrow toBestFriend';
            document.querySelector('#allFriends').appendChild(e.target.parentElement);
        }
    }
});


const friendSearch = document.querySelector('#friendSearch');
const bestFriendSearch = document.querySelector('#bestFriendSearch');

// Следующие 2 слушателя убирают возможность перемещать текст в инпутах
// Ибо этот текст можно было перемещать в drop зону
friendSearch.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

const allBestFriends = document.querySelector('#allBestFriends');
const allFriends = document.querySelector('#allFriends');

bestFriendSearch.addEventListener('dragstart', (e) => {
   e.preventDefault();
});

// фильтрация обычных друзей
friendSearch.addEventListener('input', () => {
    const friendList = allFriends.children;
    filterFriends(friendList, friendSearch);
});

// фильтрация лучших друзей
bestFriendSearch.addEventListener('input', () => {
    const friendList = allBestFriends.children;
    filterFriends(friendList, bestFriendSearch);
});

// сама фильтрация
function filterFriends(friends, search) {
    if (!friends.length) {
        return;
    }

   for (const friend of friends) {
       const name = friend.children[1].innerText.toLowerCase();
       filter(friend, name);
   }

   function filter(friend, name) {
       const filterValue = search.value ? search.value.toLowerCase() : '';

       !name.includes(filterValue)
           ? friend.classList.add('none')
           : friend.classList.contains('none') && friend.classList.remove('none');
   }
}

allBestFriends.addEventListener('DOMNodeInserted', () => {
    const friendList = allBestFriends.children;
    filterFriends(friendList, bestFriendSearch);
});

allFriends.addEventListener('DOMNodeInserted', () => {
    const friendList = allFriends.children;
    filterFriends(friendList, friendSearch);
});

