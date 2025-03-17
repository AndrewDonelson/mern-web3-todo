// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    uint public taskCount = 0;
    
    struct Task {
        uint id;
        string content;
        bool completed;
        address owner;
    }
    
    mapping(uint => Task) public tasks;
    
    event TaskCreated(
        uint id,
        string content,
        bool completed,
        address owner
    );
    
    event TaskCompleted(
        uint id,
        bool completed
    );
    
    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false, msg.sender);
        emit TaskCreated(taskCount, _content, false, msg.sender);
    }
    
    function toggleCompleted(uint _id) public {
        Task memory _task = tasks[_id];
        require(_task.owner == msg.sender, "Only the owner can modify this task");
        _task.completed = !_task.completed;
        tasks[_id] = _task;
        emit TaskCompleted(_id, _task.completed);
    }
}