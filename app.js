//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); //To use static files

//Connecting mongodb using mongoose
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI);

// Connection Handling
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB successfully!");
});


// Tasks schema and model
const itemSchema = {
  name: String,
};

const TodoItem = mongoose.model("todoItem", itemSchema);

// Different lists schema and model
const listSchema = {
  name: String,
  items: [itemSchema],
};

const ListCollection = mongoose.model("listCollection", listSchema);

//Making default items
// const item1 = new TodoItem({
//   name: "Welcome to your todolist",
// });
// const item2 = new TodoItem({
//   name: "Hit the + button add new item",
// });
// const item3 = new TodoItem({
//   name: "<-- Hit this to delete the item",
// });

// const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate();

  //Add default items if there's no item present else find the items and send it to home route
  TodoItem.find({}, function (err, results) {
    // if (results.length === 0) {
    //   TodoItem.insertMany(defaultItems, function (err) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       console.log("Successfully saved default items");
    //       res.redirect("/");
    //     }
    //   });
    // } else {
    //   res.render("list", { listTitle: "Today", newListItems: results });
    // }
    res.render("list", { listTitle: "Today", newListItems: results });
  });
});

app.get("/:customListName", function (req, res) {
  const listName = req.params.customListName.toLowerCase();

  ListCollection.findOne({ name: listName }, function (err, findList) {
    if (err) {
      console.error("Error fetching custom list:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!err) {
      if (!findList) {
        const list = new ListCollection({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: findList.name,
          newListItems: findList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // console.log(listName);

  const item = new TodoItem({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    ListCollection.findOne({ name: listName }, function (err, findList) {
      // console.log(findList.items);
      findList.items.push(item);
      findList.save();
      res.redirect("/" + listName);
    });
  }
});

// Post to delete item when checkbox is clicked
app.post("/delete", function (req, res) {
  // console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    TodoItem.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    ListCollection.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, findList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on " + port + " successfully.");
});
