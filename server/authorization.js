export function isAdmin(user) {
  return user?.role === 'admin';
}

export function canViewMonitor(user, monitor) {
  return Boolean(user && monitor && (isAdmin(user) || monitor.ownerId === user.id));
}

export function visibleMonitors(user, monitors) {
  return monitors.filter((monitor) => canViewMonitor(user, monitor));
}
