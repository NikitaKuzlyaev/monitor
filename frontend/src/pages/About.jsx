import './About.css'

function About({staffData}) {
  return (
    <div className="page about">
      <h1 className="information_field">{staffData && staffData.information_page ? staffData.information_page : '.'}</h1>
    </div>
  )
}

export default About
