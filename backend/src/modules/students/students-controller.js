const asyncHandler = require("express-async-handler");
const {
    getAllStudents,
    addNewStudent,
    getStudentDetail,
    setStudentStatus,
    updateStudent,
} = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const students = await getAllStudents(req.query);

    res.status(200).json({
        data: students,
    });
});

const handleAddStudent = asyncHandler(async (req, res) => {
    const result = await addNewStudent(req.body);

    res.status(201).json(result);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    const result = await updateStudent({
        ...req.body,
        id: req.params.id,
    });

    res.status(200).json(result);
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const student = await getStudentDetail(req.params.id);

    res.status(200).json({
        data: student,
    });
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const result = await setStudentStatus({
        userId: req.params.id,
        reviewerId: req.body.reviewerId,
        status: req.body.status,
    });

    res.status(200).json(result);
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
};