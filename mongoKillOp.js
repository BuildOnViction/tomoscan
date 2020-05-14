currOp = db.currentOp();
maxSecsRunning = 10
for (oper in currOp.inprog) {
    op = currOp.inprog[oper-0];
    if (op.secs_running && op.secs_running > maxSecsRunning) {
        print("Killing opId: " + op.opid
            + " running over for secs: "
            + op.secs_running);
        db.killOp(op.opid);
    }
}
