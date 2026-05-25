module.exports = (io, socket) => {
  // Listen for group events
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
  });
};
