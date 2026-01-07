
const updateDocument = async (req, res) => {
  try {

    const body = req.body


    console.log("okok", body)

  } catch (error) {
    console.log(error)
    res.json({ message: "une erreur s'est produite" })
  }
}

export default updateDocument