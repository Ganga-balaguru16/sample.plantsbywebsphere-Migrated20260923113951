import React, { useState, useEffect } from 'react';

interface ErrorProps {
  /** The error message returned by the server. */
  message?: string;
  /** HTTP status code of the error. */
  statusCode?: number;
  /** Exception stack trace or description. */
  exceptionInfo?: string;
  /** URL that caused the error. */
  url?: string;
  /** Method used to obtain error information (e.g., WebSphere or Servlet 2.2). */
  method?: string;
}

/**
 * Error page component that mirrors the original JSP layout.
 * All dynamic data is passed in via props. If no props are supplied,
 * default placeholder values are used.
 */
const ErrorPage: React.FC<ErrorProps> = ({
  message = 'not available',
  statusCode = -1,
  exceptionInfo = 'not available',
  url = 'information not available',
  method = '',
}) => {
  const [errorData, setErrorData] = useState({
    message,
    statusCode,
    exceptionInfo,
    url,
    method,
  });

  // Update state whenever props change
  useEffect(() => {
    setErrorData({
      message,
      statusCode,
      exceptionInfo,
      url,
      method,
    });
  }, [message, statusCode, exceptionInfo, url, method]);

  // Helper to escape HTML special characters
  const escapeHtml = (str: string) =>
    str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <table width="90%" cellSpacing={0} cellPadding={0}>
        <tbody>
          <tr>
            <td width="2%" />
            <td width="98%">
              <hr />
            </td>
          </tr>
          <tr>
            <td bgcolor="#e7e4e7" rowSpan={4} />
            <td>
              <font color="#000000" size="+2">
                An Error has occured during PlantsByWebSphere processing
              </font>
            </td>
          </tr>
          <tr>
            <td>
              <h2>Jsp Error Page</h2>
              {errorData.method && <div>{errorData.method}</div>}
              <br />
              <br />
              <b>Processing request:</b> {errorData.url}
              <br />
              <b>StatusCode:</b> {errorData.statusCode}
              <br />
              <b>Message:</b>{' '}
              {escapeHtml(errorData.message)}
              <br />
              <b>Exception:</b>{' '}
              {escapeHtml(errorData.exceptionInfo)}
            </td>
          </tr>
          <tr>
            <td align="left">
              Please Check the application server log files for details...
            </td>
          </tr>
          <tr>
            <td>
              <hr />
            </td>
          </tr>
        </tbody>
      </table>

      <table border={0} cellPadding={0} cellSpacing={0} width="100%">
        <tbody>
          <tr>
            <td bgcolor="#ffffff" width={10}>
              <img
                border={0}
                src="resources/images/1x1_trans.gif"
                width={10}
                height={1}
                alt=""
              />
            </td>
            <td bgcolor="#ffffff" width="100%">
              <img
                border={0}
                src="resources/images/pbw.jpg"
                width={181}
                height={48}
                alt="Plants by WebSphere"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ErrorPage;