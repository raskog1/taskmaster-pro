var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function (taskEl) {
  // Get date from task element
  let date = $(taskEl).find("span").text().trim();

  // Convert to moment object at 5:00PM
  let time = moment(date, "L").set("hour", 17);

  // Remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // Apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }

  console.log(taskEl);
}

// Event listener to update clicked saved todo's
$(".list-group").on("click", "p", function () {
  let text = $(this).text().trim();
  let textInput = $("<textarea>").addClass("form-control").val(text);
  // Method to replace tags
  $(this).replaceWith(textInput);
  // Focuses element so input is selected with cursor inside
  textInput.trigger("focus");
  console.log(text);
})

// Event listener for click out of the textarea for updating
$(".list-group").on("blur", "textarea", function () {
  // Get the textarea's current value/text
  let text = $(this).val().trim();

  // Get the parent ul's id attribute
  let status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's position in the list of other li elements
  let index = $(this).closest(".list-group-item").index();

  // Update our tasks array with the new data
  tasks[status][index].text = text;
  saveTasks();

  // Convert <textarea> back into a <p> element
  let taskP = $("<p>").addClass("m-1").text(text);

  // Replace <textarea> with <p> element
  $(this).replaceWith(taskP);
})

// Event listener to update clicked saved todo dates
$(".list-group").on("click", "span", function () {
  // Get current text
  let date = $(this).text().trim();

  // Create new input element
  let dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);

  // Swap out elements
  $(this).replaceWith(dateInput);

  // Enable jQuery UI datepicker
  dateInput.datepicker({
    minDate: 1,
    // When calendar is closed, force a "change" event on the "dateInput"
    onClose: function () {
      $(this).trigger("change");
    }
  })

  // Automatically focus on new element
  dateInput.trigger("focus");
})

// Event listener for click out of the date input for updating
$(".list-group").on("change", "input[type='text']", function () {
  // Get current text
  let date = $(this).val().trim();

  // Get the parent ul's id attribute
  let status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's position in the list of other li elements
  let index = $(this).closest(".list-group-item").index();

  // Update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // Recreate span element with bootstrap classes
  let taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);

  // Replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (event) {
    $(event.target).addClass("dropover-active");
    $(".bottom-trash").addClass(".bottom-trash-active");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  drop: function (event) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  update: function (event) {
    const tempArr = [];

    $(this).children().each(function () {
      // Obtain the info from any lists that were altered
      let text = $(this).find("p").text().trim();
      let date = $(this).find("span").text().trim();
      tempArr.push({
        text: text,
        date: date
      })
    })
    console.log(tempArr);

    // Trim down list's ID to match object property
    let arrName = $(this).attr("id").replace("list-", "");
    // Update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    ui.draggable.remove();
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
  }
})

$("#modalDueDate").datepicker({
  minDate: 1
});

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 1800000);

// load tasks for the first time
loadTasks();



