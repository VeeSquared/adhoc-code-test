var requiredFieldNames = ["age", "rel"];

var messageTypes = {
    GENERAL: 'general',
    WARNING: 'warning',
    ERROR:   'error',
}

var messageGeneral = {
    SUBMITTED            : 'Household members have been submitted. '
}

var messageError = {
    REQUIRED            : 'This field is required. ',
    NOTNATURALNUMBER    : 'This field must be a number greater than 0. ',
    NEEDMEMBERS         : 'Please add at least one member prior to submitting. ',
    BLOCKEDSITEDATA     : 'Please enable cookies and site data. '
}

var messageDisplayCount = {
    BLOCKSITEDATA: 0
}

var maxMessageDisplay = {
    BLOCKSITEDATA: 1
}

function person (age, relationship, smoker) {
    this.age = age;
    this.relationship = relationship;
    this.smoker = smoker; 
}
 
//event handlers
document.addEventListener('DOMContentLoaded', function(){
    var sectionBuilder = document.querySelectorAll('[class="builder"]');
    var formHousehold = sectionBuilder[0].querySelectorAll("form")[0];
    var debugElement = document.querySelectorAll('pre[class="debug"]')[0];
    var olHHMembers = sectionBuilder[0].querySelectorAll('ol[class="household"]');
    var buttonHHAdd = formHousehold.querySelectorAll('button[class="add"]');
    var inputHHMemberAge = formHousehold.querySelectorAll('input[name="age"]');
    var selectHHRelationship = formHousehold.querySelectorAll('select[name="rel"]');
    var checkboxHHSmoker = formHousehold.querySelectorAll('input[name="smoker"]');

    //build delete previous member button
    initializeDeleteMemberButton(olHHMembers);
    var deleteButton = sectionBuilder[0].querySelectorAll('button[class="button-delete-member"]');
    
    var listHHMembers = [];

    listHHMembers = getLocalSession('hhmembers');
    updateMemberDisplayList(listHHMembers, olHHMembers, deleteButton[0]);

    //Add Member Event Handler
    buttonHHAdd[0].addEventListener('click', function (event) {
        event.preventDefault();

        if(validateForm(formHousehold))
        {
            var ageFieldValue = parseInt(inputHHMemberAge[0].value, 10);
            var relationshipFieldValue = selectHHRelationship[0].value;
            var smokerFieldValue = checkboxHHSmoker[0].checked;
            listHHMembers = addHHMember(listHHMembers, ageFieldValue, relationshipFieldValue, smokerFieldValue);
            updateMemberDisplayList(listHHMembers, olHHMembers, deleteButton[0]);
            clearForm(formHousehold);
        }
    });

    //Remove a previously added person from the list
    deleteButton[0].addEventListener('click', function (event) {
        event.preventDefault();

        listHHMembers.pop();
        updateMemberDisplayList(listHHMembers, olHHMembers, deleteButton[0]);
    });

    //Submit pseudo request
    formHousehold.addEventListener('submit', function (event) {
        event.preventDefault();

        if (listHHMembers.length > 0) {
            var payload = JSON.stringify(listHHMembers);

            debugElement.textContent = payload;
            debugElement.style.display = "inline-block" ;

            listHHMembers = [];
            clearForm(formHousehold);

            updateMemberDisplayList(listHHMembers, olHHMembers, deleteButton[0]);

            alert(messageGeneral.SUBMITTED);

        } else {
            alert(messageError.NEEDMEMBERS);

        }

    });
});

//loop through all the form input fields and validate
function validateForm(formHousehold){
    var intFieldErrorCount = 0;

    for (var i = 0; i < formHousehold.length; i++) {
        if(formHousehold[i].name !== ""){
            deleteFieldNotification(formHousehold[i], messageTypes.ERROR);

            if(isRequiredFieldError(formHousehold[i])){
                intFieldErrorCount++;
            }

            if(isFieldValidationError(formHousehold[i])){
                intFieldErrorCount++;
            }
        }
    }

    return (intFieldErrorCount == 0) ? true : false;
}

//make sure there is a value for the required input field element. If not add required notification.
function isRequiredFieldError(element) {
    var fieldName = element.name;
    var fieldValue = element.value;

    if(isFieldRequired(fieldName) && (fieldValue === ""))
    {
        createFieldNotification(element, messageTypes.ERROR, messageError.REQUIRED);
        return true;
    }

    return false;
}

//make sure input field element value passes custom validation. If not add error notification.
function isFieldValidationError(element){
    var fieldName = element.name;
    var fieldValue = element.value;

    switch (fieldName){
        case "age":
            if(!isNaturalNumber(fieldValue))
            {
                createFieldNotification(element, messageTypes.ERROR, messageError.NOTNATURALNUMBER);
                return true;
            }
            break;
        default:
            return false;
    }

    return false;
}

//remove all field notifications
function deleteFieldNotification (element, messageType){
    var notificationClassName = (messageType + "-" + "notification");
    var notificationElement = element.parentNode.getElementsByClassName(notificationClassName);

    if(notificationElement.length > 0){
        removeAllChildElements(notificationElement);
        element.style.borderColor = "";
    }
}

//add person to member list and return list
function addHHMember (listHHMembers, age, relationship, smoker) {
    var hHMember = new person();

    hHMember.age = age;
    hHMember.relationship = relationship;
    hHMember.smoker = smoker;

    listHHMembers.push(hHMember);
    return listHHMembers;
}

//clear list and reload with updated list of members. Save session to client storage.
function updateMemberDisplayList(listHHMembers,olHHMembers, deleteButtonElement){
    var lengthHHMembers = listHHMembers.length;
    removeAllChildElements(olHHMembers[0].childNodes);
    
    if(lengthHHMembers > 0){
        for(var i = 0; i < lengthHHMembers; i++){
            elementData = getDisplayListElement(listHHMembers[i]);
            addListElement(olHHMembers[0],elementData);
        }
        displayElement(deleteButtonElement,true);
    }
    else 
    {
        displayElement(deleteButtonElement,false);
    }

    updateLocalSession('hhmembers',listHHMembers);
}

//Add person element to household member ordered list
function addListElement(listHHMember, elementData){
    var listMemberRow = document.createElement('li');
    var elementContent = document.createTextNode(elementData);
    listMemberRow.appendChild(elementContent);

    listHHMember.appendChild(listMemberRow);
}

//Create remove last member button 
function initializeDeleteMemberButton(olHHMembers){
    var buttonDelete = document.createElement("button");
    buttonDelete.innerHTML = "Remove Previous Member";
    buttonDelete.setAttribute('class','button-delete-member');
    displayElement(buttonDelete,false);
    olHHMembers[0].parentNode.insertBefore(buttonDelete, olHHMembers[0].nextSibling);
}

//builds household member item for list
function getDisplayListElement(obj){
    var elementData = "";
 
    for (var key in obj) {
        keyValue = getStringValue(obj[key]);
        keyName = captalizeFirstCharacter(key.toString());
        elementData = elementData + " ";
        elementData = elementData + keyName + ": " + keyValue + ". ";
    }

    return elementData;
}


/***vvv Helper Functions vvv***/
//check if number is natural number
function isNaturalNumber(number) {
    return (!isNaN(number) && number !== "" && number >= 1) ? true : false;
}

//check if field is required by field name
function isFieldRequired(fieldName){
    return requiredFieldNames.includes(fieldName);
}

//create field notification
function createFieldNotification (obj, messageType, message){
    var notificationClassName = (messageType + "-" + "notification");
    var notification = document.createElement('span');

    notification.setAttribute('class',notificationClassName);
    obj.parentNode.appendChild(notification);

    switch (messageType){
        case messageTypes.GENERAL:
            notification.style.color = "#000000";
            obj.style.borderColor = "";
            break;
        case messageTypes.WARNING:
            notification.style.color = "#FFA500";
            obj.style.borderColor = "#FFA500";
            break;
        case messageTypes.ERROR:
            notification.style.color = "#FF0000";
            obj.style.borderColor = "#FF0000";
            break;
        default:
            break;
    }

    notification.innerHTML = message;
}

//format string value
function getStringValue(value){
    switch (typeof(value)){
        case "boolean":
            return captalizeFirstCharacter(replaceBooleanForWord(value));
        case "number":
            return value.toString();
        case "string":
            return captalizeFirstCharacter(value);
        default:
            return "";
    }
}

//clear form data
function clearForm(obj){
    for (var i = 0; i < obj.length; i++) {
        if(obj[i].name !== ""){
            setFieldValue(obj[i], "");           
        };
    }
}

//set field value
function setFieldValue(obj, value){
    var fieldType = obj.type;

    switch(fieldType){
        case "checkbox":
            if (value) 
            { 
                obj.checked = true;
            } 
            else 
            {
                obj.checked = false;
            }
            break;
        default:
            obj.value = value;
            break;
    }
}

//show or hide element
function displayElement(obj,showElement){
    if(showElement){
        obj.style.display = "inline-block";
    }
    else{
        obj.style.display = "none";
    }
}

//substitute boolean keywords for string values 
function replaceBooleanForWord(boolValue){
    return (boolValue) ? "yes" : "no";
}

//capitalize first character of a string
function captalizeFirstCharacter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

//remove all child elements of a node
function removeAllChildElements(obj){
    var objectLength = obj.length;

    if(objectLength > 0){
        for(var i = (objectLength-1); i >= 0; i--){
            obj[i].parentNode.removeChild(obj[i]);
        }
    }
}

//create or update client storage data
function updateLocalSession (storageItem, data){
    try {
        localStorage.setItem(storageItem, JSON.stringify(data));
    }
    catch(err)
    {
        if(messageDisplayCount.BLOCKSITEDATA < maxMessageDisplay.BLOCKSITEDATA){
            alert(messageError.BLOCKEDSITEDATA);
            console.log("Error updating local session. Error:" + err);
            messageDisplayCount.BLOCKSITEDATA++;
        }
    }
}

//retrieve or update client storage data
function getLocalSession (storageItem){
    try {
        if(localStorage.getItem(storageItem) !== null)
        {
            var data = localStorage.getItem(storageItem);
            return JSON.parse(data);
        }
    }
    catch(err)
    {
        if(messageDisplayCount.BLOCKSITEDATA < maxMessageDisplay.BLOCKSITEDATA)
        {
            alert(messageError.BLOCKEDSITEDATA);
            console.log("Error restoring local session. Error:" + err);
            messageDisplayCount.BLOCKSITEDATA++;
        }
    }

    return [];
}
/***^^^ Helper Functions ^^^***/



