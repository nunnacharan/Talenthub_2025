import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './CandidateDetails.css';
import oneVectorImage from './images/onevector.png';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTheme } from "../ThemeContext"; // Ensure correct import path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, ChevronRight, LogOut, Eye, Download, Edit2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { SkillsEditForm, CertificationsEditForm } from './EditSandC';
import LoadingSpinner from './LoadingSpinner';
import { Toggle } from "@/components/ui/toggle";
import {SunIcon, MoonIcon } from '@heroicons/react/solid';


function CandidateDetails() {
    const location = useLocation();
    const candidate = location.state?.candidate; // Get candidate data from the state
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [isEditing, setIsEditing] = useState({
        personal: false,
        qualifications: false,
        skills: false,
        certifications: false
    });
    const [skills, setSkills] = useState([]);
        const [certifications, setCertifications] = useState([]);
        const [selectedSkills, setSelectedSkills] = useState([]);
        const [selectedCertifications, setSelectedCertifications] = useState([]);
        const [newSkill, setNewSkill] = useState('');
        const [newCertification, setNewCertification] = useState('');
        
    
        // New state to manage dropdown visibility
        const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
        const [isCertificationsDropdownOpen, setIsCertificationsDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        personalDetails: {},
        qualifications: [],
        skills: [],
        username: '',
        certifications: []
    });
    const [resumeFile, setResumeFile] = useState(null); // For handling resume file upload
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useTheme();
    const [originalData, setOriginalData] = useState({
      personalDetails: {},
      qualifications: [],
      skills: [],
      certifications: []
  });
  const [draftData, setDraftData] = useState({
    personalDetails: {},
    qualifications: [],
    skills: [],
    certifications: []
});

// Update useEffect to initialize data
useEffect(() => {
    if (candidate?.id) {
        fetchPersonalDetails(candidate.id);
    }
}, [candidate]);

useEffect(() => {
  const fetchSkillsAndCertifications = async () => {
      try {
          const skillsResponse = await axios.get('https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/skills');
          setSkills(skillsResponse.data.map(skill => skill.skill_name));

          const certificationsResponse = await axios.get('https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/certifications');
          setCertifications(certificationsResponse.data.map(cert => cert.certification_name));
      } catch (error) {
          console.error('Error fetching skills and certifications:', error);
      }
  };

  fetchSkillsAndCertifications();
}, []);

const fetchPersonalDetails = async (id) => {
    try {
        const response = await axios.get(`https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/personalDetails/${id}`);
        const initialData = {
            personalDetails: {
                ...response.data.personalDetails,
                username: candidate.username // Include username from candidate data
            } || {},
            qualifications: response.data.qualifications || [],
            skills: response.data.skills || [],
            certifications: response.data.certifications || []
        };
        setDetails(response.data);
        setFormData(initialData);
    } catch (err) {
        setError('Failed to fetch personal details');
        console.error(err);
    } finally {
        setLoading(false);
    }
};

const handleEditToggle = (section) => {
  console.log('Toggling edit mode for section:', section);
  console.log('Current editing state:', isEditing);
  
  if (!isEditing[section]) {
      setDraftData({
          ...draftData,
          [section]: section === 'personalDetails'
              ? { ...formData.personalDetails }
              : [...formData[section]]
      });
  }
  
  setIsEditing(prevState => {
      const newState = {
          ...prevState,
          [section]: !prevState[section]
      };
      console.log('New editing state:', newState);
      return newState;
  });
};

const toggleSkillsDropdown = () => {
  setIsSkillsDropdownOpen(!isSkillsDropdownOpen);
};

const toggleCertificationsDropdown = () => {
  setIsCertificationsDropdownOpen(!isCertificationsDropdownOpen);
};

const handleSkillSelect = (skill) => {
  if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
  }
  setIsSkillsDropdownOpen(false); // Close the dropdown after selection
};

const handleCertificationSelect = (certification) => {
  if (!selectedCertifications.includes(certification)) {
      setSelectedCertifications([...selectedCertifications, certification]);
  }
  setIsCertificationsDropdownOpen(false); // Close the dropdown after selection
};


// Update handleChange to modify draft data instead of actual data
const handleChange = (e) => {
  const { name, value } = e.target;
  
  if (name.startsWith('personalDetails.')) {
      const field = name.split('.')[1];
      setDraftData(prev => ({
          ...prev,
          personalDetails: {
              ...prev.personalDetails,
              [field]: value
          }
      }));
  } else if (name.startsWith('qualification_')) {
        const [, index, field] = name.split('_');
        setDraftData(prev => {
            const updatedQualifications = [...prev.qualifications];
            if (!updatedQualifications[index]) {
                updatedQualifications[index] = {};
            }
            updatedQualifications[index] = {
                ...updatedQualifications[index],
                [field]: value
            };
            return {
                ...prev,
                qualifications: updatedQualifications
            };
        });
    }
};

      // Prepare the data for Excel export
      const handleDownloadDetails = () => {
        // Prepare data for row-by-row export
        const rowData = [
            // Header Row
            ['Candidate Details'],
            [], // Empty row for spacing
    
            // Personal Details Section
            ['Personal Details'],
            ['Username', candidate.username || 'N/A'],
            ['First Name', formData.personalDetails?.first_name || 'N/A'],
            ['Last Name', formData.personalDetails?.last_name || 'N/A'],
            ['Phone Number', formData.personalDetails?.phone_no || 'N/A'],
            ['City', formData.personalDetails?.city || 'N/A'],
            ['State', formData.personalDetails?.state || 'N/A'],
            ['Postal Code', formData.personalDetails?.postal_code || 'N/A'],
            ['Address', formData.personalDetails?.address_line1 || 'N/A'],
            ['LinkedIn URL', formData.personalDetails?.linkedin_url || 'N/A'],
            [], // Empty row for separation
    
            // Qualifications Section
            ['Qualifications'],
        ...formData.qualifications.flatMap((qual) => [
            ['Recent Job', qual.recent_job || 'N/A'],
            ['Preferred Roles', qual.preferred_roles || 'N/A'],
            ['Availability', qual.availability || 'N/A'],
            ['Compensation', qual.compensation || 'N/A'],
            ['Preferred Role Type', qual.preferred_role_type || 'N/A'],
            ['Preferred Work Arrangement', qual.preferred_work_arrangement || 'N/A'],
            [] // Empty row between qualification sets
        ]),
    
            // Skills Section
            ['Skills', formData.skills.join(', ') || 'N/A'],
            [], // Empty row for separation
    
            // Certifications Section
            
            ['Certifications', formData.certifications.join(', ') || 'N/A']
        ];
    
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rowData);
    
        // Style for header rows
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } }
        };
    
        // Apply styling to section headers
        ['A1', 'A3', 'A12', 'A24', 'A26'].forEach(cell => {
            if (worksheet[cell]) {
                worksheet[cell].s = headerStyle;
            }
        });
    
        // Adjust column widths
        worksheet['!cols'] = [
            { wch: 30 },  // First column
            { wch: 50 }   // Second column
        ];
    
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Details');
    
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Create and save the file
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${candidate.username}_details.xlsx`);
    };

  // Fixed handleSubmit function
  const handleSubmit = async (e, section) => {
    e.preventDefault();
    if (!details?.personalDetails?.id) {
        setError('No ID found for update');
        return;
    }

    try {
        const id = details.personalDetails.id;
        const formDataToSubmit = new FormData();

        switch (section) {
            case 'personalDetails':
                Object.entries(draftData.personalDetails).forEach(([key, value]) => {
                    formDataToSubmit.append(key, value);
                });
                if (resumeFile) {
                    formDataToSubmit.append('resume', resumeFile);
                }
                await axios.put(`https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/candidates/${id}/personal`, formDataToSubmit, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Update actual data after successful submit
                setFormData(prev => ({
                    ...prev,
                    personalDetails: draftData.personalDetails
                }));
                break;

            case 'qualifications':
                await axios.put(`https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/candidates/${id}/qualifications`, {
                    qualifications: draftData.qualifications
                });
                // Update actual data after successful submit
                setFormData(prev => ({
                    ...prev,
                    qualifications: draftData.qualifications
                }));
                break;
              case 'skills':
                  await axios.put(`https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/candidates/${id}/skills`, {
                      skills: formData.skills
                  });
                  break;

              case 'certifications':
                  await axios.put(`https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/candidates/${id}/certifications`, {
                      certifications: formData.certifications
                  });
                  break;
          }
          handleEditToggle(section);
    } catch (err) {
        setError(`Failed to update ${section}: ${err.message}`);
    }
    };

    const handleAddSkill = () => {
      if (newSkill.trim()) {
        setFormData({
          ...formData,
          skills: [...formData.skills, newSkill.trim()]
        });
        setNewSkill('');
      }
    };
    
    const handleRemoveSkill = (index) => {
      const newSkills = formData.skills.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        skills: newSkills
      });
    };
    
    const handleAddCertification = () => {
      if (newCertification.trim()) {
        setFormData({
          ...formData,
          certifications: [...formData.certifications, newCertification.trim()]
        });
        setNewCertification('');
      }
    };
    
    const handleRemoveCertification = (index) => {
      const newCertifications = formData.certifications.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        certifications: newCertifications
      });
    };
    

    const handleResumeUpload = async () => {
        if (!resumeFile) {
            setError('Please select a resume file to upload');
            return;
        }
        
        const formData = new FormData();
        formData.append('resume', resumeFile);
        
        try {
            const response = await axios.post('https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/uploadResume', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Handle success - maybe show a success message
            console.log('Resume uploaded successfully:', response.data);
        } catch (error) {
            setError('Failed to upload resume');
        }
    };

    const handleDownloadResume = async () => {
           try {
               const resumeUrl = `https://5q5faxzgb7.execute-api.ap-south-1.amazonaws.com/api/resume/${details.personalDetails.id}`;
               window.open(resumeUrl, '_blank'); // Opens the resume in a new tab
             } catch (error) {
               alert('Failed to view resume');
             }
   };

   const handleResumeChange = (e, index) => {
    const file = e.target.files[0]; // Get the uploaded file
    if (file) {
      const updatedQualifications = [...formData.qualifications];
      updatedQualifications[index].resume_path = file.name; // Update the resume_path with the file name
      setFormData({
        ...formData,
        qualifications: updatedQualifications,
      });
    }
  };

    const handleLogout = () => {
      localStorage.removeItem('token');
      navigate('/');
    };
    
const recentJob = formData.qualifications.length > 0 ? formData.qualifications[0].recent_job : 'No Recent Job';

  

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  {loading ? (
      <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
      </div>
  ) : (
    <>

{/* Header Section */}
<header
className={cn(
"fixed top-0 left-0 right-0 z-10 shadow-md",
isDarkMode ? "bg-gray-800" : "bg-white"
)}
>
<div className="flex justify-between items-center p-2 sm:p-4 w-full">
{/* Logo and Title */}
<div className="flex items-center space-x-2">
<img
 src={oneVectorImage}
 alt="OneVector Logo"
 className="w-5 h-6 sm:w-8 sm:h-8"
/>
<h1
 className={cn(
   "text-lg sm:text-2xl font-medium tracking-wide",
   "text-transparent bg-clip-text bg-gradient-to-r from-[#15BACD] to-[#094DA2]"
 )}
>
 TalentHub
</h1>
</div>

{/* Action Buttons */}
<div className="flex items-center space-x-2">
{/* Dark Mode Toggle Button */}
<Toggle
 onClick={toggleTheme}
 className={cn(
   "p-1 sm:p-2 rounded-full",
   isDarkMode
     ? "bg-gray-700 hover:bg-gray-600"
     : "bg-gray-200 hover:bg-gray-300"
 )}
>
 {isDarkMode ? (
   <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-100" />
 ) : (
   <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
 )}
</Toggle>

{/* Logout Button */}
<Button
 variant="outline"
 onClick={handleLogout}
 className={cn(
   "px-3 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 rounded-full flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold transition-all",
   isDarkMode
     ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800"
     : "bg-gradient-to-r from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700"
 )}
>
 <svg
   xmlns="http://www.w3.org/2000/svg"
   fill="none"
   viewBox="0 0 24 24"
   strokeWidth="1.5"
   stroke="currentColor"
   className="w-4 h-4 sm:w-5 sm:h-5"
 >
   <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-7.5A2.25 2.25 0 003.75 5.25v13.5A2.25 2.25 0 006 21h7.5a2.25 2.25 0 002.25-2.25V15"
   />
   <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M18 12H9m0 0l3-3m-3 3l3 3"
   />
 </svg>
 <span>Logout</span>
</Button>
</div>
</div>
</header>

{/* Main Content */}
<div className="px-4 py-8 sm:px-6 sm:py-12">
{/* Breadcrumb */}
<div className="flex items-center space-x-2 mt-8 mb-4">
<Button
variant="ghost"
size="sm"
onClick={() => navigate('/admin-dashboard')}
className={cn(
"gap-2 px-2 py-1 rounded-md text-sm sm:text-base transition-all",
isDarkMode
  ? "hover:bg-gray-600 text-white"
  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
)}
>
<Home className="h-4 w-4 sm:h-6 sm:w-6" />
Dashboard
</Button>
<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
<span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
Candidate Details
</span>
</div>

{/* Profile Header */}
<div className="bg-gradient-to-r from-[#15BACD] to-[#094DA2] p-4 sm:p-6 rounded-lg mb-4 shadow-lg">
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
{/* Name and Job */}
<div>
<h2 className="text-lg sm:text-3xl font-bold text-white leading-tight">
{`${formData?.personalDetails?.first_name || ''} ${formData?.personalDetails?.last_name || ''}`.trim() || 'N/A'}
</h2>
<p className="text-sm sm:text-xl text-gray-100 mt-1 sm:mt-2">
{formData.qualifications?.[0]?.recent_job || 'No Recent Job'}
</p>
</div>

{/* Buttons */}
<div className="flex flex-col w-full sm:w-auto sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
<Button
className="w-full sm:w-auto bg-white hover:bg-gray-100 text-[#094DA2] font-medium text-sm sm:text-base px-3 sm:px-4 py-2 rounded-md flex items-center justify-center"
onClick={handleDownloadResume}
>
<Eye className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
View Resume
</Button>
<Button
className="w-full sm:w-auto bg-white hover:bg-gray-100 text-[#094DA2] font-medium text-sm sm:text-base px-3 sm:px-4 py-2 rounded-md flex items-center justify-center"
onClick={handleDownloadDetails}
>
<Download className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
Download Details
</Button>
</div>
</div>
</div>

<div className="bg-white dark:bg-gray-800 rounded-lg mb-6">
<div className="border-b border-gray-200 dark:border-gray-700 p-6">
<div className="flex justify-between items-center">
<h3 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Details</h3>
<Button 
variant="outline" 
size="sm" 
onClick={() => handleEditToggle('personalDetails')} 
className="border-[#15BACD] text-[#15BACD] hover:bg-[#15BACD] hover:text-white transition-colors"
>
<Edit2 className="h-4 w-4 " />
Edit Details
</Button>
</div>
</div>

<div className="p-6">
{isEditing.personalDetails ? (
<form onSubmit={(e) => handleSubmit(e, 'personalDetails')}>
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full">
      <div className="space-y-2">
        <Label className="text-gray-700 dark:text-gray-300">Username</Label>
        <Input name="personalDetails.username"
    value={draftData.personalDetails?.username || ''}
    disabled
          className="bg-gray-100 border-gray-300 dark:border-gray-600 cursor-not-allowed"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">Phone Number</Label>
  <Input
    name="personalDetails.phone_no"
    value={draftData.personalDetails?.phone_no || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">Country</Label>
  <Input
    name="personalDetails.country"
    value={draftData.personalDetails?.country || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">City</Label>
  <Input
    name="personalDetails.city"
    value={draftData.personalDetails?.city || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">State</Label>
  <Input
    name="personalDetails.state"
    value={draftData.personalDetails?.state || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">Postal Code</Label>
  <Input
    name="personalDetails.postal_code"
    value={draftData.personalDetails?.postal_code || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">Address</Label>
  <Input
    name="personalDetails.address_line1"
    value={draftData.personalDetails?.address_line1 || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
<div className="w-full space-y-2">
  <Label className="text-gray-700 dark:text-gray-300">LinkedIn URL</Label>
  <Input
    name="personalDetails.linkedin_url"
    value={draftData.personalDetails?.linkedin_url || ''}
    onChange={handleChange}
    className="w-full border-gray-300 dark:border-gray-600 focus:border-[#15BACD] focus:ring-[#15BACD]"
  />
</div>
</div>
<div className="flex justify-end space-x-3 mt-6">
<Button 
  type="button" 
  variant="outline" 
  onClick={() => handleEditToggle('personalDetails')}
  className="border-gray-300 text-gray-700 hover:bg-gray-100"
>
  Cancel
</Button>
<Button 
  type="submit"
  className="bg-gradient-to-r from-[#15BACD] to-[#094DA2] text-white"
>
  Save Changes
</Button>
</div>
</form>
) : (
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">Username</Label>
<p className="font-medium text-[#343636] dark:text-white">{candidate.username || 'N/A'}</p>
</div>
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">Phone Number</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.phone_no || 'N/A'}</p>
</div>
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">Country</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.country || 'N/A'}</p>
</div>
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">City</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.city || 'N/A'}</p>
</div>
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">State</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.state || 'N/A'}</p>
</div>
<div className="space-y-2">
<Label className="text-sm text-gray-500 dark:text-gray-400">Postal Code</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.postal_code || 'N/A'}</p>
</div>
<div className="space-y-2 col-span-2 lg:col-span-1">
<Label className="text-sm text-gray-500 dark:text-gray-400">Address</Label>
<p className="text-[#343636] dark:text-white font-medium">{formData.personalDetails?.address_line1 || 'N/A'}</p>
</div>
<div className="space-y-2 col-span-2 lg:col-span-1">
<Label className="text-sm text-gray-500 dark:text-gray-400">LinkedIn URL</Label>
{formData.personalDetails?.linkedin_url ? (
  <a
    href={formData.personalDetails.linkedin_url}
    target="_blank"
    rel="noopener noreferrer"
    className="block truncate text-black dark:text-white font-medium underline"
    title={formData.personalDetails.linkedin_url}
  >
    {formData.personalDetails.linkedin_url}
  </a>
) : (
  <p className="text-gray-900 dark:text-white font-medium">N/A</p>
)}
</div>
</div>
)}
</div>
</div>

<div className="bg-white dark:bg-gray-800 rounded-lg mb-6">
<div className="border-b border-gray-200 dark:border-gray-700 p-6">
<div className="flex justify-between items-center">
<h3 className="text-xl font-semibold text-gray-900 dark:text-white">Qualifications</h3>
<Button 
variant="outline" 
size="sm" 
onClick={() => handleEditToggle('qualifications')}
className="border-[#15BACD] text-[#15BACD] hover:bg-[#15BACD] hover:text-white transition-colors"
>
<Edit2 className="h-4 w-4 mr-2" />
Edit Details
</Button>
</div>
</div>

<div className="p-6">
{isEditing.qualifications ? (
<form onSubmit={(e) => handleSubmit(e, 'qualifications')}>
{draftData.qualifications.map((qual, index) => (
<div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="space-y-2 col-span-1">
  <Label>Recent Job</Label>
  <Input
    name={`qualification_${index}_recent_job`}
    value={qual.recent_job || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1">
  <Label>Preferred Role</Label>
  <Input
    name={`qualification_${index}_preferred_roles`}
    value={qual.preferred_roles || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] focus:ring-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1">
  <Label>Availability</Label>
  <Input
    name={`qualification_${index}_availability`}
    value={qual.availability || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] focus:ring-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1">
  <Label>Compensation</Label>
  <Input
    name={`qualification_${index}_compensation`}
    value={qual.compensation || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] focus:ring-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1">
  <Label>Preferred Role Type</Label>
  <Input
    name={`qualification_${index}_preferred_role_type`}
    value={qual.preferred_role_type || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] focus:ring-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1">
  <Label>Preferred Work Type</Label>
  <Input
    name={`qualification_${index}_preferred_work_arrangement`}
    value={qual.preferred_work_arrangement || ''}
    onChange={handleChange}
    className="border-gray-300 focus:border-[#15BACD] focus:ring-[#15BACD] w-full"
  />
</div>
<div className="space-y-2 col-span-1 md:col-span-2 md:col-start-3 md:col-end-4">
  <Label>Resume</Label>
  <Input
    type="file"
    name={`qualification_${index}_resume`}
    onChange={(e) => handleResumeChange(e, index)}
    className="block mt-2 w-full"
  />
</div>
</div>
))}
<div className="flex justify-end space-x-3 mt-6">
<Button 
type="button" 
variant="outline" 
onClick={() => handleEditToggle('qualifications')}
className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
>
Cancel
</Button>
<Button 
type="submit"
className="bg-gradient-to-r from-[#15BACD] to-[#094DA2] text-white hover:opacity-90"
>
Save Changes
</Button>
</div>
</form>
) : (
<div className="space-y-6">
{formData.qualifications.map((qual, index) => (
<div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-6">
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Recent Job</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.recent_job || 'N/A'}</p>
</div>
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Preferred Role</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.preferred_roles || 'N/A'}</p>
</div>
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Availability</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.availability || 'N/A'}</p>
</div>
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Compensation</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.compensation || 'N/A'}</p>
</div>
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Preferred Role Type</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.preferred_role_type || 'N/A'}</p>
</div>
<div className="space-y-2">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Preferred Work Type</Label>
  <p className="text-gray-900 dark:text-white font-medium">{qual.preferred_work_arrangement || 'N/A'}</p>
</div>
<div className="space-y-2 col-span-2 md:col-start-3 md:col-end-4">
  <Label className="text-sm text-gray-500 dark:text-gray-400">Resume</Label>
  <p className="text-sm text-gray-600 dark:text-gray-400">{formData.personalDetails?.resume_path || 'No resume uploaded'}</p>
</div>
</div>
))}
</div>
)}</div>
</div>


{/* Skills and Certifications Grid */}
<div className="grid md:grid-cols-2 gap-8">
{/* Skills Section */}
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
<div className="border-b border-gray-200 dark:border-gray-700 p-6">
<div className="flex justify-between items-center">
<h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skills</h3>
<Button 
variant="outline" 
size="sm" 
onClick={() => handleEditToggle('skills')}
className="border-[#15BACD] text-[#15BACD] hover:bg-[#15BACD] hover:text-white transition-colors"
>
<Edit2 className="h-4 w-4 mr-2" />
Edit Skills
</Button>
</div>
</div>

<div className="p-6">
{isEditing.skills ? (
<SkillsEditForm
handleSubmit={handleSubmit}
newSkill={newSkill}
setNewSkill={setNewSkill}
formData={formData}
setFormData={setFormData}
handleRemoveSkill={handleRemoveSkill}
handleEditToggle={handleEditToggle}
details={details}
skills={skills}
isSkillsDropdownOpen={isSkillsDropdownOpen}
setIsSkillsDropdownOpen={setIsSkillsDropdownOpen}
/>
) : (
<div className="flex flex-wrap gap-2">
  {formData.skills.map((skill, index) => (
    <div
      key={index} 
      className="inline-flex items-center h-8 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full text-sm border border-gray-300 dark:border-gray-600"
    >
      {skill}
    </div>
  ))}
</div>
)}
</div>
</div>

{/* Certifications Section */}
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
<div className="border-b border-gray-200 dark:border-gray-700 p-6">
<div className="flex justify-between items-center">
<h3 className="text-xl font-semibold text-gray-900 dark:text-white">Certifications</h3>
<Button 
variant="outline" 
size="sm" 
onClick={() => handleEditToggle('certifications')}
className="border-[#15BACD] text-[#15BACD] hover:bg-[#15BACD] hover:text-white transition-colors"
>
<Edit2 className="h-4 w-4 mr-2" />
<span className="hidden md:inline">Edit Certifications</span>
<span className="inline md:hidden">Edit Certs</span>
</Button>
</div>
</div>

<div className="p-6">
{isEditing.certifications ? (
<CertificationsEditForm
handleSubmit={handleSubmit}
newCertification={newCertification}
setNewCertification={setNewCertification}
formData={formData}
setFormData={setFormData}
handleRemoveCertification={handleRemoveCertification}
handleEditToggle={handleEditToggle}
details={details}
certifications={certifications}
isCertificationsDropdownOpen={isCertificationsDropdownOpen}
setIsCertificationsDropdownOpen={setIsCertificationsDropdownOpen}
/>
) : (
<div className="flex flex-wrap gap-2">
  {formData.certifications.map((cert, index) => (
    <div
      key={index} 
      className="inline-flex items-center h-8 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full text-sm border border-gray-300 dark:border-gray-600"
    >
      {cert}
    </div>
  ))}
</div>
)}
</div>
</div>
</div>
</div>
</>
  )
  }
</div>
)
}  

export default CandidateDetails;
