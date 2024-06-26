document.addEventListener('DOMContentLoaded', function() {
    // Get the existing textarea
    const textAreaNote = document.getElementById('textareanote');
    Object.assign(textAreaNote.style, {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowY: 'auto'
    });

    // Create and style the dropdown
    const dropdown = document.createElement('div');
    dropdown.classList.add('tagDropdown');
    Object.assign(dropdown.style, {
        position: 'absolute',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        borderRadius: '10px',
        zIndex: '10000', // Increased z-index
        width: '25vw', // Set width to 10vw
        maxHeight: '20vh',
        overflowY: 'auto'
    });
    document.body.appendChild(dropdown);

    // Add styles for hidden and blue text
    const style = document.createElement('style');
    style.innerHTML = `
        .hidden { display: none; }
        .tagDropdown .dropdown-item { padding: 8px 16px; cursor: pointer; }
        .tagDropdown .dropdown-item:hover { background-color: #f1f1f1; border-radius: 10px; }
        .blue-text { color: blue; }
    `;
    document.head.appendChild(style);

    let users = [
        { name: 'everyone', email: '' }  // @everyone feature
    ];

    // Function to update users from Wized data
    async function updateUsers() {
        const groupUsers = await Wized.data.get('v.group_users'); // Get new value
        users = [
            { name: 'everyone', email: '' },  // @everyone feature
            ...groupUsers.map(user => ({
                name: `${user.First_Name} ${user.Last_Name}`,
                email: user.Email_2
            }))
        ];
        console.log('Updated users:', users);
    }

    // Listen to changes in v.group_users
    Wized.data.listen('v.group_users', updateUsers);

    let requestId;

    textAreaNote.addEventListener('input', function() {
        const value = textAreaNote.value;
        const atPosition = value.lastIndexOf('@');
        console.log('Input event: ', value);

        if (atPosition !== -1) {
            if (requestId) {
                cancelAnimationFrame(requestId);
            }
            requestId = requestAnimationFrame(() => {
                const query = value.slice(atPosition + 1).toLowerCase();
                const matches = users.filter(user => user.name.toLowerCase().startsWith(query));

                dropdown.innerHTML = '';
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const item = document.createElement('div');
                        item.classList.add('dropdown-item');

                        const name = document.createElement('span');
                        name.textContent = match.name;
                        item.appendChild(name);

                        if (match.email) {
                            const email = document.createElement('span');
                            email.textContent = ` (${match.email})`;
                            email.style.color = 'rgba(0, 0, 0, 0.5)';
                            email.style.marginLeft = '5px';
                            item.appendChild(email);
                        }

                        item.addEventListener('click', () => {
                            const before = value.slice(0, atPosition);
                            const after = value.slice(atPosition + query.length + 1);
                            const newText = before + '@' + match.name + ' ' + after;
                            textAreaNote.value = newText;
                            textAreaNote.focus();
                            textAreaNote.setSelectionRange(newText.length, newText.length);

                            // Highlight the @username text
                            const highlightedText = textAreaNote.value.replace(/@(\w+)/g, '<span class="blue-text">@$1</span>');
                            textAreaNote.innerHTML = highlightedText;

                            // Hide dropdown
                            dropdown.style.display = 'none';
                            console.log('Dropdown hidden after selecting a user');
                        });

                        dropdown.appendChild(item);
                    });
                    console.log('Dropdown opened:', matches);
                    dropdown.style.display = 'block';

                    const rect = textAreaNote.getBoundingClientRect();
                    const caretCoords = getCaretCoordinates(textAreaNote, atPosition + 1);
                    dropdown.style.top = `${rect.top + window.scrollY + caretCoords.top + 20}px`;
                    dropdown.style.left = `${rect.left + window.scrollX + caretCoords.left}px`;
                } else {
                    console.log('No matches found, hiding dropdown');
                    dropdown.style.display = 'none';
                }
            });
        } else {
            console.log('No @ detected, hiding dropdown');
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('mousedown', function(event) {
        if (!textAreaNote.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
            console.log('Dropdown hidden on click outside');
        }
    });

    textAreaNote.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            dropdown.style.display = 'none';
            console.log('Dropdown hidden on ESC key');
        }
    });

    textAreaNote.addEventListener('click', function(event) {
        dropdown.style.display = 'none';
        console.log('Dropdown hidden on click inside textarea');
    });

    function getCaretCoordinates(element, position) {
        const div = document.createElement('div');
        document.body.appendChild(div);

        const styles = window.getComputedStyle(element);
        for (const prop of styles) {
            div.style[prop] = styles[prop];
        }
        div.style.position = 'absolute';
        div.style.whiteSpace = 'pre-wrap';
        div.style.visibility = 'hidden';

        const before = document.createTextNode(element.value.slice(0, position));
        const after = document.createTextNode(element.value.slice(position));
        const span = document.createElement('span');
        span.textContent = element.value.slice(position) || '.';

        div.appendChild(before);
        div.appendChild(span);
        div.appendChild(after);

        const coords = {
            top: span.offsetTop + span.offsetHeight,
            left: span.offsetLeft
        };

        document.body.removeChild(div);
        return coords;
    }
});
