import leaverequestCollection from "../models/leaverequest.modal.js"

const cancelLeaverequest = async (req, res) => {
  try {

    console.log("ok")

    const { _id } = req.body

    if (!_id) return res.json({ message: "une erreur c'est produite" })

    console.log(_id)

    const leaverequest = await leaverequestCollection.findByIdAndUpdate(
      _id, { status: "cancel" }

    )
    await leaverequest.save()
    return res.json({ message: "demande de conge annuel", success: false })

  } catch (error) {
    console.log(error)
    return res.json({ message: "une erreur c'est produite" })
  }
}

export default cancelLeaverequest