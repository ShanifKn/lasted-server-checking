exports.registerTemplate = (url) => {
  const content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
    <tbody>
    <tr>
    <td width='460'>
    <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
    Forgot your Bathool password?
    </h1>
    </td>
    </tr>
    <tr>
    <td width='460'>
    <p>
    <strong>
    Dear Candidate,
    </strong>
    </p>
    <p>
    Kindly use the below link to register to bathool's staff account. 
    <p>
    <a href="${url}">Register</a>
    </p>
    </p>
     <p>
     If you have already registered please confidently disregard and delete this email. 
     </p>
     <p>
     If you have any questions, please feel free to contact admin on hello@bathool.com
     </p>
     <p>
     Regards,
     </p>
     <p style='color:#00622A;font-size:16px;'>Bathool
     </p>
     </td>
     </tr>
     </tbody>
     </table>`;

  return content;
};

exports.emailFromBatchTemplate = async (coverletter) => {
  //const coverletter = `sddfff`;
  /*
  const content = `<br>
  <div style="margin-top:4px;padding-top:4px;border-top:1px solid #f1f1f1;padding-bottom:4px;border-bottom:1px solid #f1f1f1">
  <br>
  <table cellspacing="0" cellpadding="0"><tbody><tr>
  <td>Name </td>
  <td></td>
  </tr>
  <tr>
  <td>Experience</td>
  <td></td>
  </tr>
  <tr>
  <td>Salary</td>
  <td></td>
  </tr>
  <tr>
  <td>Location</td>
  <td></td>
  </tr>
  <tr>
  <td>Visa</td>
  <td></td>
  </tr>
  <tr>
  <td>Phone Number&nbsp;&nbsp;&nbsp;&nbsp;</td>
  <td></td>
  </tr>
  <tr>
  <td>Email</td>
  <td></td>
  </tr>
  </tbody>
  </table>
  <br>
  </diV>`;
  const footNote = `<span style="font-size:12px;color:#666666">
  If you want to unsubscribe from the candidates who wish to work in your company, please reply and ask to unsubscribe (Ref # '.$seeker.')</span>`;
  const fullContent = `<div><div>` + {coverletter}+`</div><div>`+{content}+`</div><br></div>`+{footNote};
  */
  return coverletter;
};

