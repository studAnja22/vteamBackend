const errorHelper = {
    handleError: function handleError(e, res) {
        if (e.message.includes("400")) {
            return res.status(400).json({ status: 400, error: e.message.replace('400:', '') });
        } else if (e.message.includes("409")) {
            return res.status(409).json({ status: 409, error: e.message.replace('409:', '') });
        } else if (e.message.includes("500")) {
            return res.status(500).json({ status: 500, error: e.message.replace('500:', '') });
        } else {
            return res.status(500).json({ status: 500, error: e.message.replace('500:', '') });
        }
    }
}

export default errorHelper;